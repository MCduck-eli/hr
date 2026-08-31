import { PrismaClient } from "@prisma/client";
import { AppError } from "../../utils/appError";

const prisma = new PrismaClient();

export class DashboardService {
    async getEmployeeDashboardData(id: string) {
        let user = await prisma.user.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        department: true,
                        position: true,
                        grade: true,
                        statusConfig: true,
                        courseProgresses: {
                            include: { course: true },
                        },
                        onboarding: {
                            include: {
                                courses: {
                                    include: {
                                        course: {
                                            include: {
                                                template: true,
                                            },
                                        },
                                    },
                                },
                                tasks: {
                                    include: {
                                        task: {
                                            include: {
                                                template: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        lifecycleEvents: {
                            orderBy: { createdAt: "desc" },
                            take: 3,
                        },
                    },
                },
            },
        });

        if (!user) {
            const employeeRecord = await prisma.employee.findUnique({
                where: { id },
                select: { userId: true },
            });
            if (employeeRecord?.userId) {
                user = await prisma.user.findUnique({
                    where: { id: employeeRecord.userId },
                    include: {
                        employee: {
                            include: {
                                department: true,
                                position: true,
                                grade: true,
                                statusConfig: true,
                                courseProgresses: {
                                    include: { course: true },
                                },
                                onboarding: {
                                    include: {
                                        courses: {
                                            include: {
                                                course: {
                                                    include: {
                                                        template: true,
                                                    },
                                                },
                                            },
                                        },
                                        tasks: {
                                            include: {
                                                task: {
                                                    include: {
                                                        template: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                lifecycleEvents: {
                                    orderBy: { createdAt: "desc" },
                                    take: 3,
                                },
                            },
                        },
                    },
                });
            }
        }

        if (!user) {
            throw new AppError("Foydalanuvchi topilmadi", 404);
        }

        if (
            !user.employee &&
            (user.role === "SUPER_ADMIN" || user.role === "HR_ADMIN")
        ) {
            let adminEmployee = await prisma.employee.findFirst({
                where: { userId: user.id },
            });
            if (!adminEmployee) {
                adminEmployee = await prisma.employee.create({
                    data: {
                        userId: user.id,
                        firstName: user.firstName || "Admin",
                        lastName: user.lastName || "User",
                        status: "NEW",
                    },
                });
            }
            user = await prisma.user.findUnique({
                where: { id: user.id },
                include: {
                    employee: {
                        include: {
                            department: true,
                            position: true,
                            grade: true,
                            statusConfig: true,
                            courseProgresses: {
                                include: { course: true },
                            },
                            onboarding: {
                                include: {
                                    courses: {
                                        include: {
                                            course: {
                                                include: {
                                                    template: true,
                                                },
                                            },
                                        },
                                    },
                                    tasks: {
                                        include: {
                                            task: {
                                                include: {
                                                    template: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            lifecycleEvents: {
                                orderBy: { createdAt: "desc" },
                                take: 3,
                            },
                        },
                    },
                },
            });
        }

        const employee = user?.employee;

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        const pendingFeedbacks = await prisma.feedbackAssignment.count({
            where: {
                reviewerId: employee.id,
                isCompleted: false,
            },
        });

        const targetedCourses = await prisma.academyCourse.findMany({
            where: {
                ...(user.companyName ? { companyName: user.companyName } : {}),
                OR: [
                    { targetEmployeeId: employee.id },
                    { AND: [{ targetEmployeeId: null }, { targetDepartmentId: null }] },
                    ...(employee.departmentId ? [{ targetDepartmentId: employee.departmentId }] : [])
                ]
            }
        });

        const academyCourses = targetedCourses.map((course) => {
            const cp = (employee.courseProgresses || []).find((p: any) => p.courseId === course.id);
            return {
                id: course.id,
                title: course.title || "Academy Kursi",
                description: course.description,
                coverUrl: course.coverUrl,
                videoUrl: course.videoUrl,
                progress: cp?.progressPercent || 0,
                type: "ACADEMY",
                isCompleted: cp?.isCompleted || false,
            };
        });

        const allTemplates = await prisma.onboardingTemplate.findMany({
            where: {
                ...(user.companyName ? { companyName: user.companyName } : {}),
            },
            include: {
                tasks: true,
                courses: true,
                targetStatusConfig: true,
            },
        });

        const matchingTemplates = allTemplates.filter((t) => {
            if (
                t.departmentId &&
                employee.departmentId &&
                t.departmentId !== employee.departmentId
            ) {
                return false;
            }

            const isTemplateForAll = !t.targetStatusConfigId && !t.targetStatus;
            if (isTemplateForAll) return true;

            if (t.targetStatusConfigId) {
                return employee.statusConfigId === t.targetStatusConfigId;
            }

            if (t.targetStatus) {
                if (employee.statusConfig?.code) {
                    return employee.statusConfig.code === t.targetStatus;
                }
                return employee.status === t.targetStatus;
            }

            return false;
        });

        const employeeOnboardingRecord =
            await prisma.employeeOnboarding.findUnique({
                where: { employeeId: employee.id },
                include: {
                    courses: {
                        where: {
                            course: {
                                template: {
                                    ...(user.companyName ? { companyName: user.companyName } : {}),
                                },
                            },
                        },
                        include: {
                            course: {
                                include: {
                                    template: true,
                                },
                            },
                        },
                    },
                    tasks: {
                        where: {
                            task: {
                                template: {
                                    ...(user.companyName ? { companyName: user.companyName } : {}),
                                },
                            },
                        },
                        include: {
                            task: {
                                include: {
                                    template: true,
                                },
                            },
                        },
                    },
                },
            });

        const onboardingCourses = matchingTemplates.flatMap((t) => {
            const templateEnrollments = (
                employeeOnboardingRecord?.courses || []
            ).filter(
                (item: any) =>
                    item.courseId === t.id ||
                    item.course?.templateId === t.id ||
                    (t.courses &&
                        t.courses.some((c) => c.id === item.courseId)),
            );

            const latestProgress = templateEnrollments.reduce((max, item) => {
                const p = item.isCompleted
                    ? 100
                    : item.progressPercent || 0;
                return p > max ? p : max;
            }, 0);

            const isTemplateCompleted =
                templateEnrollments.some(
                    (item) =>
                        item.isCompleted ||
                        (item.progressPercent || 0) >= 95,
                ) || latestProgress >= 95;

            if (t.courses && t.courses.length > 0) {
                return t.courses.map((c) => {
                    const specificEnrollment = templateEnrollments.find(
                        (item: any) => item.courseId === c.id,
                    );
                    const progress = specificEnrollment
                        ? specificEnrollment.isCompleted
                            ? 100
                            : specificEnrollment.progressPercent || 0
                        : latestProgress;
                    const isDone = isTemplateCompleted || progress >= 95;
                    return {
                        id: c.id,
                        title: c.title || t.title,
                        description: c.description || t.description,
                        coverUrl: t.coverUrl,
                        videoUrl: c.videoUrl || t.videoUrl,
                        progress: isDone ? 100 : progress,
                        type: "ONBOARDING",
                        isCompleted: isDone,
                    };
                });
            } else {
                return [
                    {
                        id: t.id,
                        title: t.title || "Onboarding Kursi",
                        description: t.description,
                        coverUrl: t.coverUrl,
                        videoUrl: t.videoUrl,
                        progress: isTemplateCompleted ? 100 : latestProgress,
                        type: "ONBOARDING",
                        isCompleted: isTemplateCompleted,
                    },
                ];
            }
        });

        const allMatchingTasks = matchingTemplates.flatMap((t) => t.tasks);

        const onboardingTasks = allMatchingTasks.map((t) => {
            const ot = (employeeOnboardingRecord?.tasks || []).find(
                (item: any) => item.taskId === t.id,
            );
            return {
                id: t.id,
                title: t.title || "Onboarding Vazifa",
                description: t.description,
                progress: ot?.status === "COMPLETED" ? 100 : 0,
                type: "ONBOARDING_TASK",
                isCompleted: ot?.status === "COMPLETED" || false,
            };
        });

        const activeCourses = [
            ...academyCourses,
            ...onboardingCourses,
            ...onboardingTasks,
        ];

        let okrProgress = 0;
        let okrs: any[] = [];
        let minExpectedProgress = 0;

        let currentCycle = await prisma.okrCycle.findFirst({
            where: {
                isCurrent: true,
                ...(user.companyName ? { companyName: user.companyName } : {}),
            },
        });

        if (!currentCycle) {
            currentCycle = await prisma.okrCycle.findFirst({
                where: user.companyName ? { companyName: user.companyName } : {},
                orderBy: { startDate: "desc" },
            });
        }

        const employeeOkrs = await prisma.objective.findMany({
            where: {
                ...(currentCycle ? { cycleId: currentCycle.id } : {}),
                ...(user.companyName ? { companyName: user.companyName } : {}),
                OR: [
                    { level: "COMPANY" },
                    ...(employee.departmentId ? [{ level: "DEPARTMENT" as const, departmentId: employee.departmentId }] : []),
                    {
                        level: "INDIVIDUAL" as const,
                        OR: [
                            { employeeId: employee.id },
                            { employeeId: user.id },
                        ],
                    },
                ],
            },
            include: { 
                keyResults: {
                    include: { checkIns: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        if (currentCycle) {
            minExpectedProgress = currentCycle.minExpectedProgress || 0;
        }

        if (employeeOkrs.length > 0) {
            const total = employeeOkrs.reduce((acc, okr) => acc + okr.progress, 0);
            okrProgress = Math.round(total / employeeOkrs.length);
            
            const okrsWithMinProgress = employeeOkrs.filter(o => o.minExpectedProgress !== null && o.minExpectedProgress !== undefined);
            if (okrsWithMinProgress.length > 0) {
                const totalMin = okrsWithMinProgress.reduce((acc, okr) => acc + (okr.minExpectedProgress as number), 0);
                minExpectedProgress = Math.round(totalMin / okrsWithMinProgress.length);
            }

            okrs = employeeOkrs;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendances = await prisma.attendance.findMany({
            where: { employeeId: employee.id },
            orderBy: { date: "desc" },
        });

        let totalMs = 0;
        const now = new Date();
        for (const att of attendances) {
            if (att.checkIn && att.checkOut) {
                totalMs += att.checkOut.getTime() - att.checkIn.getTime();
            } else if (att.checkIn && att.date.getTime() === today.getTime()) {
                totalMs += Math.max(0, now.getTime() - att.checkIn.getTime());
            } else if (att.checkIn) {
                totalMs += 8 * 60 * 60 * 1000;
            }
        }
        const attendanceHours = Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;

        const todayAtt = attendances.find(
            (a) => a.date.getTime() === today.getTime(),
        );

        const todayAttendance = {
            isCheckedIn: Boolean(todayAtt?.checkIn),
            isCheckedOut: Boolean(todayAtt?.checkOut),
            checkInTime: todayAtt?.checkIn ? todayAtt.checkIn.toISOString() : null,
            checkOutTime: todayAtt?.checkOut ? todayAtt.checkOut.toISOString() : null,
            status: todayAtt?.status || null,
        };

        const employeeGrade = employee.grade ? {
            id: employee.grade.id,
            code: employee.grade.code,
            title: employee.grade.title,
            level: employee.grade.level,
            minSalary: employee.grade.minSalary,
            maxSalary: employee.grade.maxSalary,
            requirements: employee.grade.requirements,
            responsibilities: employee.grade.responsibilities,
        } : null;

        const employeePosition = employee.position?.title || employee.position || null;
        const employeeSalary = employee.salary || employee.grade?.minSalary || null;

        const companyFilter = user.companyName || null;

        const feedbackAssignments = await prisma.feedbackAssignment.findMany({
            where: {
                targetId: employee.id,
                isCompleted: true,
                ...(companyFilter ? { cycle: { companyName: companyFilter } } : {}),
            },
            include: { answers: true },
        });

        let totalFeedbackScore = 0;
        let totalAnswers = 0;
        feedbackAssignments.forEach((asg) => {
            asg.answers.forEach((ans) => {
                totalFeedbackScore += ans.score;
                totalAnswers += 1;
            });
        });
        const feedback360Score = totalAnswers > 0
            ? Number((totalFeedbackScore / totalAnswers).toFixed(1))
            : null;
        let nextGrade = null;
        if (employee.grade) {
            nextGrade = await prisma.jobGrade.findFirst({
                where: {
                    level: { gt: employee.grade.level },
                    ...(companyFilter ? { OR: [{ companyName: companyFilter }, { companyName: null }] } : {}),
                },
                orderBy: { level: "asc" },
            });
        } else {
            nextGrade = await prisma.jobGrade.findFirst({
                where: {
                    ...(companyFilter ? { OR: [{ companyName: companyFilter }, { companyName: null }] } : {}),
                },
                orderBy: { level: "asc" },
            });
        }

        const activePromotionRequest = await prisma.promotionRequest.findFirst({
            where: {
                employeeId: employee.id,
                status: { in: ["PENDING", "APPROVED_BY_MANAGER"] },
            },
            include: {
                targetGrade: true,
                currentGrade: true,
            },
            orderBy: { createdAt: "desc" },
        });

        const careerPath = {
            currentGrade: employeeGrade,
            nextGrade: nextGrade ? {
                id: nextGrade.id,
                code: nextGrade.code,
                title: nextGrade.title,
                level: nextGrade.level,
                minSalary: nextGrade.minSalary,
                maxSalary: nextGrade.maxSalary,
                requirements: nextGrade.requirements,
                responsibilities: nextGrade.responsibilities,
            } : null,
            activePromotionRequest: activePromotionRequest ? {
                id: activePromotionRequest.id,
                status: activePromotionRequest.status,
                targetGradeTitle: activePromotionRequest.targetGrade?.title,
                targetGradeLevel: activePromotionRequest.targetGrade?.level,
                proposedSalary: activePromotionRequest.proposedSalary,
                reason: activePromotionRequest.reason,
                createdAt: activePromotionRequest.createdAt,
            } : null,
            okrTarget: 80,
            currentOkr: okrProgress,
            feedbackTarget: 4.0,
            currentFeedback: feedback360Score,
            isOkrMet: okrProgress >= 80,
            isFeedbackMet: feedback360Score !== null && feedback360Score >= 4.0,
            isReadyForPromotion: okrProgress >= 80 && (feedback360Score === null || feedback360Score >= 4.0),
        };

        const discAssessment = await prisma.discAssessment.findFirst({
            where: { employeeId: employee.id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                primaryType: true,
                secondaryType: true,
                dScore: true,
                iScore: true,
                sScore: true,
                cScore: true,
                createdAt: true,
            },
        });

        return {
            user: {
                firstName: employee.firstName,
                lastName: employee.lastName,
                role: user.role,
                email: user.email,
                companyName: user.companyName,
                employee: {
                    id: employee.id,
                    department: employee.department?.name || null,
                    position: employeePosition,
                    salary: employeeSalary,
                    grade: employeeGrade,
                },
            },
            grade: employeeGrade,
            position: employeePosition,
            salary: employeeSalary,
            careerPath,
            discAssessment,
            feedback360Score,
            okrProgress,
            minExpectedProgress,
            okrs,
            attendanceHours,
            todayAttendance,
            pendingFeedbacks,
            leaveBalance: employee.leaveBalance,
            activeCourses,
            recentActivities: (employee.lifecycleEvents || []).map((event) => ({
                title: event.title,
                description: event.description,
                timeAgo: "Yaqinda",
            })),
        };
    }

    async updateVideoProgress(
        userId: string,
        payload: {
            courseId: string;
            type: string;
            progress: number;
            targetUserId?: string;
        },
    ) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (user?.role === "SUPER_ADMIN" || user?.role === "HR_ADMIN") {
            return null;
        }

        let targetId = userId;
        if (
            payload.targetUserId &&
            (user?.role === "SUPER_ADMIN" || user?.role === "HR_ADMIN")
        ) {
            targetId = payload.targetUserId;
        }

        let employee = await prisma.employee.findUnique({
            where: { userId: targetId },
        });

        if (!employee) {
            employee = await prisma.employee.findUnique({
                where: { id: targetId },
            });
        }

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        const isFullyCompleted = payload.progress >= 95;

        if (payload.type === "ACADEMY") {
            return prisma.courseProgress.upsert({
                where: {
                    courseId_employeeId: {
                        courseId: payload.courseId,
                        employeeId: employee.id,
                    },
                },
                update: {
                    progressPercent: payload.progress,
                    isCompleted: isFullyCompleted ? true : undefined,
                    completedAt: isFullyCompleted ? new Date() : undefined,
                },
                create: {
                    courseId: payload.courseId,
                    employeeId: employee.id,
                    progressPercent: payload.progress,
                    isCompleted: isFullyCompleted,
                    completedAt: isFullyCompleted ? new Date() : undefined,
                },
            });
        }

        if (payload.type === "ONBOARDING") {
            let onboarding = await prisma.employeeOnboarding.findUnique({
                where: { employeeId: employee.id },
            });

            if (!onboarding) {
                onboarding = await prisma.employeeOnboarding.create({
                    data: {
                        employeeId: employee.id,
                        status: "IN_PROGRESS",
                    },
                });
            }

            let validCourseId = payload.courseId;
            const existingCourse = await prisma.onboardingCourse.findUnique({
                where: { id: payload.courseId },
            });

            if (!existingCourse) {
                const template = await prisma.onboardingTemplate.findUnique({
                    where: { id: payload.courseId },
                    include: { courses: true },
                });

                if (template) {
                    if (template.courses && template.courses.length > 0) {
                        validCourseId = template.courses[0].id;
                    } else {
                        const newCourse = await prisma.onboardingCourse.create({
                            data: {
                                templateId: template.id,
                                title: template.title,
                                description: template.description,
                                videoUrl: template.videoUrl || "",
                            },
                        });
                        validCourseId = newCourse.id;
                    }
                }
            }

            return prisma.employeeOnboardingCourse.upsert({
                where: {
                    onboardingId_courseId: {
                        onboardingId: onboarding.id,
                        courseId: validCourseId,
                    },
                },
                update: {
                    progressPercent: payload.progress,
                    isCompleted: isFullyCompleted ? true : undefined,
                    completedAt: isFullyCompleted ? new Date() : undefined,
                },
                create: {
                    onboardingId: onboarding.id,
                    courseId: validCourseId,
                    progressPercent: payload.progress,
                    isCompleted: isFullyCompleted,
                    completedAt: isFullyCompleted ? new Date() : undefined,
                },
            });
        }
    }
}

export const dashboardService = new DashboardService();

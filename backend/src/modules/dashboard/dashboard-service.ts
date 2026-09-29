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
                ...(user.companyName ? { OR: [{ companyName: user.companyName }, { companyName: null }] } : {}),
            },
        });

        if (!currentCycle) {
            currentCycle = await prisma.okrCycle.findFirst({
                where: user.companyName ? { OR: [{ companyName: user.companyName }, { companyName: null }] } : {},
                orderBy: { startDate: "desc" },
            });
        }

        const employeeIdMatches = [
            employee.id,
            user.id,
            ...(employee.userId ? [employee.userId] : []),
        ].filter(Boolean);

        const userCompany = user.companyName || (employee as any).user?.companyName || null;
        const companyFilter = userCompany
            ? { OR: [{ companyName: userCompany }, { companyName: null }] }
            : {};

        const whereOkrs: any = {
            OR: [
                {
                    employeeId: { in: employeeIdMatches },
                    ...companyFilter,
                },
                {
                    level: "INDIVIDUAL" as const,
                    employeeId: { in: employeeIdMatches },
                    ...companyFilter,
                },
                ...(employee.departmentId
                    ? [
                          {
                              level: "DEPARTMENT" as const,
                              departmentId: employee.departmentId,
                              ...companyFilter,
                          },
                      ]
                    : []),
                ...(userCompany
                    ? [
                          {
                              level: "COMPANY" as const,
                              companyName: userCompany,
                          },
                      ]
                    : [{ level: "COMPANY" as const }]),
            ],
        };

        let employeeOkrs = await prisma.objective.findMany({
            where: whereOkrs,
            include: { 
                keyResults: {
                    include: { 
                        checkIns: {
                            orderBy: { createdAt: "desc" },
                        },
                    },
                },
                cycle: true,
                department: { select: { name: true } },
                employee: { select: { firstName: true, lastName: true } },
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

        const userCompanyName = user.companyName || null;

        const feedbackAssignments = await prisma.feedbackAssignment.findMany({
            where: {
                targetId: employee.id,
                isCompleted: true,
                ...(userCompanyName ? { cycle: { companyName: userCompanyName } } : {}),
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
                    ...(userCompanyName ? { OR: [{ companyName: userCompanyName }, { companyName: null }] } : {}),
                },
                orderBy: { level: "asc" },
            });
        } else {
            nextGrade = await prisma.jobGrade.findFirst({
                where: {
                    ...(userCompanyName ? { OR: [{ companyName: userCompanyName }, { companyName: null }] } : {}),
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

    async getHRDashboardActivities(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, companyName: true },
        });

        if (!user) {
            throw new AppError("Foydalanuvchi topilmadi", 404);
        }

        const companyName = user.companyName;
        const employeeCompanyFilter = companyName
            ? { user: { companyName } }
            : {};

        const [
            attendances,
            leaveRequests,
            onboardings,
            promotionRequests,
            feedbackAssignments,
            objectives,
            lifecycleEvents,
            notifications,
        ] = await Promise.all([
            prisma.attendance.findMany({
                where: {
                    employee: employeeCompanyFilter,
                },
                include: {
                    employee: {
                        include: { department: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 15,
            }),
            prisma.leaveRequest.findMany({
                where: {
                    employee: employeeCompanyFilter,
                },
                include: {
                    employee: {
                        include: { department: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
            prisma.employeeOnboarding.findMany({
                where: {
                    employee: employeeCompanyFilter,
                },
                include: {
                    employee: {
                        include: { department: true },
                    },
                    tasks: true,
                    courses: true,
                },
                orderBy: { updatedAt: "desc" },
                take: 10,
            }),
            prisma.promotionRequest.findMany({
                where: {
                    employee: employeeCompanyFilter,
                },
                include: {
                    employee: {
                        include: { department: true },
                    },
                    targetGrade: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
            prisma.feedbackAssignment.findMany({
                where: {
                    target: employeeCompanyFilter,
                    isCompleted: true,
                },
                include: {
                    target: {
                        include: { department: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
            prisma.objective.findMany({
                where: {
                    ...(companyName ? { companyName } : {}),
                    employeeId: { not: null },
                },
                include: {
                    employee: {
                        include: { department: true },
                    },
                },
                orderBy: { updatedAt: "desc" },
                take: 10,
            }),
            prisma.employeeLifecycleEvent.findMany({
                where: {
                    employee: employeeCompanyFilter,
                },
                include: {
                    employee: {
                        include: { department: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
            prisma.notification.findMany({
                where: {
                    ...(companyName ? { user: { companyName } } : {}),
                },
                include: {
                    user: {
                        include: {
                            employee: {
                                include: { department: true },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
        ]);

        const GRADIENTS = [
            "from-purple-500 to-violet-600",
            "from-amber-500 to-orange-600",
            "from-emerald-500 to-teal-600",
            "from-blue-500 to-indigo-600",
            "from-indigo-500 to-purple-600",
            "from-cyan-500 to-blue-600",
            "from-rose-500 to-pink-600",
        ];

        const getInitials = (name: string) => {
            const parts = name.trim().split(/\s+/);
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return name.slice(0, 2).toUpperCase() || "HR";
        };

        const getAvatarBg = (name: string) => {
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const idx = Math.abs(hash) % GRADIENTS.length;
            return GRADIENTS[idx];
        };

        const formatTimeAgo = (dateInput: Date | string | null | undefined) => {
            if (!dateInput) return "Yaqinda";
            const date = new Date(dateInput);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            if (diffMins < 1) return "Hozirgina";
            if (diffMins < 60) return `${diffMins} daqiqa oldin`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours} soat oldin`;
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return `${diffDays} kun oldin`;
            return date.toLocaleDateString("uz-UZ");
        };

        const items: any[] = [];

        for (const att of attendances) {
            const empName = att.employee ? `${att.employee.firstName} ${att.employee.lastName}`.trim() : "Xodim";
            const deptName = att.employee?.department?.name || "Bo'lim ko'rsatilmagan";
            const isLate = att.status === "LATE" || (att.lateMinutes && att.lateMinutes > 0);

            items.push({
                id: `att-${att.id}`,
                employeeName: empName,
                avatarInitials: getInitials(empName),
                avatarBg: getAvatarBg(empName),
                department: deptName,
                eventText: isLate
                    ? `Bugun ${att.lateMinutes ? `${att.lateMinutes} daqiqa` : "kechikib"} keldi`
                    : att.status === "PRESENT"
                    ? "Bugungi ish kuniga o'z vaqtida yetib keldi"
                    : "Davomat qayd etildi",
                timeAgo: formatTimeAgo(att.createdAt || att.date),
                category: "delay",
                badgeText: isLate ? `Kechikish${att.lateMinutes ? ` (+${att.lateMinutes}m)` : ""}` : "O'z vaqtida",
                badgeClass: isLate
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200",
                rawDate: att.createdAt ? new Date(att.createdAt).getTime() : new Date(att.date).getTime(),
            });
        }

        for (const lr of leaveRequests) {
            const empName = lr.employee ? `${lr.employee.firstName} ${lr.employee.lastName}`.trim() : "Xodim";
            const deptName = lr.employee?.department?.name || "Bo'lim ko'rsatilmagan";
            const leaveName = lr.type === "SICK" ? "Kasallik ta'tili (Sick Leave)" : lr.type === "ANNUAL" ? "Yillik mehnat ta'tili" : "Mehnat ta'tili";

            items.push({
                id: `leave-${lr.id}`,
                employeeName: empName,
                avatarInitials: getInitials(empName),
                avatarBg: getAvatarBg(empName),
                department: deptName,
                eventText: `${leaveName} so'rovini qoldirdi${lr.reason ? `: ${lr.reason}` : ""}`.trim(),
                timeAgo: formatTimeAgo(lr.createdAt),
                category: "leave",
                badgeText: lr.status === "APPROVED" ? "Tasdiqlangan" : lr.status === "REJECTED" ? "Rad etilgan" : "Ta'til so'rovi",
                badgeClass: lr.status === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : lr.status === "REJECTED"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200",
                rawDate: new Date(lr.createdAt).getTime(),
            });
        }

        for (const ob of onboardings) {
            const empName = ob.employee ? `${ob.employee.firstName} ${ob.employee.lastName}`.trim() : "Xodim";
            const deptName = ob.employee?.department?.name || "Bo'lim ko'rsatilmagan";
            const totalItems = (ob.tasks?.length || 0) + (ob.courses?.length || 0);
            const completedItems = (ob.tasks?.filter((t) => t.status === "COMPLETED").length || 0) + (ob.courses?.filter((c) => c.isCompleted).length || 0);
            const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : (ob.status === "COMPLETED" ? 100 : 0);

            items.push({
                id: `ob-${ob.id}`,
                employeeName: empName,
                avatarInitials: getInitials(empName),
                avatarBg: getAvatarBg(empName),
                department: deptName,
                eventText: progress >= 100
                    ? "Onboarding adaptatsiya dasturini to'liq yakunladi"
                    : "Onboarding adaptatsiya jarayonini davom ettirmoqda",
                timeAgo: formatTimeAgo(ob.updatedAt || ob.createdAt),
                category: "onboarding",
                badgeText: progress >= 100 ? "Onboarding yakunlandi" : "Adaptatsiya jarayoni",
                badgeClass: progress >= 100
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-cyan-50 text-cyan-700 border border-cyan-200",
                progress,
                progressColor: progress >= 100 ? "#10b981" : "#06b6d4",
                progressLabel: "Adaptatsiya",
                rawDate: new Date(ob.updatedAt || ob.createdAt).getTime(),
            });
        }

        for (const pr of promotionRequests) {
            const empName = pr.employee ? `${pr.employee.firstName} ${pr.employee.lastName}`.trim() : "Xodim";
            const deptName = pr.employee?.department?.name || "Bo'lim ko'rsatilmagan";
            const gradeTitle = pr.targetGrade?.title || "Yangi daraja";

            items.push({
                id: `pr-${pr.id}`,
                employeeName: empName,
                avatarInitials: getInitials(empName),
                avatarBg: getAvatarBg(empName),
                department: deptName,
                eventText: `${gradeTitle} bo'yicha lavozimni oshirish (Level Up) arizasini topshirdi`,
                timeAgo: formatTimeAgo(pr.createdAt),
                category: "evaluation",
                badgeText: "Karyera arizasi",
                badgeClass: "bg-indigo-50 text-indigo-700 border border-indigo-200",
                rawDate: new Date(pr.createdAt).getTime(),
            });
        }

        for (const fb of feedbackAssignments) {
            const empName = fb.target ? `${fb.target.firstName} ${fb.target.lastName}`.trim() : "Xodim";
            const deptName = fb.target?.department?.name || "Bo'lim ko'rsatilmagan";

            items.push({
                id: `fb-${fb.id}`,
                employeeName: empName,
                avatarInitials: getInitials(empName),
                avatarBg: getAvatarBg(empName),
                department: deptName,
                eventText: "360 darajali baholash so'rovnomasini to'liq yakunladi",
                timeAgo: formatTimeAgo(fb.createdAt),
                category: "evaluation",
                badgeText: "360° Baholash",
                badgeClass: "bg-purple-50 text-[#9327FF] border border-purple-200",
                progress: 100,
                progressColor: "#9327FF",
                progressLabel: "Baholash",
                rawDate: new Date(fb.createdAt).getTime(),
            });
        }

        for (const obj of objectives) {
            const empName = obj.employee ? `${obj.employee.firstName} ${obj.employee.lastName}`.trim() : "Xodim";
            const deptName = obj.employee?.department?.name || "Bo'lim ko'rsatilmagan";

            items.push({
                id: `obj-${obj.id}`,
                employeeName: empName,
                avatarInitials: getInitials(empName),
                avatarBg: getAvatarBg(empName),
                department: deptName,
                eventText: `"${obj.title}" OKR maqsadi bo'yicha oraliq ko'rsatkichni yangiladi`,
                timeAgo: formatTimeAgo(obj.updatedAt || obj.createdAt),
                category: "evaluation",
                badgeText: "OKR Natijasi",
                badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
                progress: Math.round(obj.progress || 0),
                progressColor: (obj.progress || 0) >= 70 ? "#10b981" : "#f59e0b",
                progressLabel: "Haftalik OKR",
                rawDate: new Date(obj.updatedAt || obj.createdAt).getTime(),
            });
        }

        for (const evt of lifecycleEvents) {
            const empName = evt.employee ? `${evt.employee.firstName} ${evt.employee.lastName}`.trim() : "Xodim";
            const deptName = evt.employee?.department?.name || "Bo'lim ko'rsatilmagan";

            items.push({
                id: `evt-${evt.id}`,
                employeeName: empName,
                avatarInitials: getInitials(empName),
                avatarBg: getAvatarBg(empName),
                department: deptName,
                eventText: evt.title ? `${evt.title}${evt.description ? `: ${evt.description}` : ""}`.trim() : (evt.description || "Hodisa qayd etildi"),
                timeAgo: formatTimeAgo(evt.createdAt || evt.eventDate),
                category: "all",
                badgeText: "Lifecycle",
                badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
                rawDate: new Date(evt.createdAt || evt.eventDate).getTime(),
            });
        }

        for (const notif of notifications) {
            const emp = notif.user?.employee;
            if (!emp) continue;
            const empName = `${emp.firstName} ${emp.lastName}`.trim();
            const deptName = emp.department?.name || "Bo'lim ko'rsatilmagan";

            items.push({
                id: `notif-${notif.id}`,
                employeeName: empName,
                avatarInitials: getInitials(empName),
                avatarBg: getAvatarBg(empName),
                department: deptName,
                eventText: `${notif.title}: ${notif.message}`.trim(),
                timeAgo: formatTimeAgo(notif.createdAt),
                category: "all",
                badgeText: "Bildirishnoma",
                badgeClass: "bg-purple-50 text-[#9327FF] border border-purple-200",
                rawDate: new Date(notif.createdAt).getTime(),
            });
        }

        items.sort((a, b) => b.rawDate - a.rawDate);

        return items.slice(0, 30);
    }

    async getHRDashboardSummary(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, companyName: true },
        });

        if (!user) {
            throw new AppError("Foydalanuvchi topilmadi", 404);
        }

        const companyName = user.companyName;
        const employeeCompanyFilter = companyName
            ? { user: { companyName } }
            : {};

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            totalEmployees,
            totalDepartments,
            allOnboardings,
            todayCheckedInCount,
        ] = await Promise.all([
            prisma.employee.count({
                where: {
                    ...(companyName ? { user: { companyName } } : {}),
                    user: {
                        role: { notIn: ["SUPER_ADMIN", "DIRECTOR"] },
                    },
                },
            }),
            prisma.department.count({
                where: {
                    ...(companyName ? { companyName } : {}),
                },
            }),
            prisma.employeeOnboarding.findMany({
                where: {
                    employee: employeeCompanyFilter,
                },
                include: {
                    tasks: true,
                    courses: true,
                },
            }),
            prisma.attendance.count({
                where: {
                    employee: employeeCompanyFilter,
                    date: { gte: today, lt: tomorrow },
                    OR: [
                        { checkIn: { not: null } },
                        { status: { in: ["PRESENT", "LATE", "HALF_DAY"] } },
                    ],
                },
            }),
        ]);

        let onboardingPercentage = 0;
        if (allOnboardings.length > 0) {
            let totalPercentageSum = 0;
            for (const ob of allOnboardings) {
                const totalItems = (ob.tasks?.length || 0) + (ob.courses?.length || 0);
                const completedItems = (ob.tasks?.filter((t) => t.status === "COMPLETED").length || 0) + (ob.courses?.filter((c) => c.isCompleted).length || 0);
                const p = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : (ob.status === "COMPLETED" ? 100 : 0);
                totalPercentageSum += p;
            }
            onboardingPercentage = Math.round(totalPercentageSum / allOnboardings.length);
        }

        const onboardingStatusText = onboardingPercentage >= 80
            ? "Yuqori"
            : onboardingPercentage >= 50
            ? "O'rta"
            : onboardingPercentage > 0
            ? "Boshlang'ich"
            : "Rejalar yo'q";

        const attendancePercentage = totalEmployees > 0
            ? Math.min(100, Math.round((todayCheckedInCount / totalEmployees) * 100))
            : 0;

        const attendanceStatusText = attendancePercentage >= 80
            ? "Faol"
            : attendancePercentage >= 50
            ? "O'rtacha"
            : attendancePercentage > 0
            ? "Past"
            : "Qayd etilmadi";

        return {
            totalEmployees,
            totalDepartments,
            onboardingPercentage,
            onboardingStatusText,
            attendancePercentage,
            attendanceStatusText,
            todayCheckedInCount,
        };
    }
}

export const dashboardService = new DashboardService();

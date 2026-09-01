import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class LifecycleService {
    async createTemplate(
        payload: {
            title: string;
            description?: string;
            stage: any;
            companyName?: string;
            tasks: { title: string; description?: string; dueDays: number }[];
        },
        currentUser?: any,
    ) {
        let companyName = payload.companyName;
        if (!companyName && currentUser?.companyName) {
            companyName = currentUser.companyName;
        }

        return prisma.lifecycleTemplate.create({
            data: {
                title: payload.title,
                description: payload.description,
                stage: payload.stage,
                companyName: companyName || null,
                tasks: {
                    create: payload.tasks,
                },
            },
            include: { tasks: true },
        });
    }

    async getTemplates(currentUser?: any) {
        const where: any = {};
        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            where.companyName = currentUser.companyName;
        }

        return prisma.lifecycleTemplate.findMany({
            where,
            include: { tasks: true },
            orderBy: { createdAt: "desc" },
        });
    }

    async updateTemplate(
        templateId: string,
        payload: {
            title?: string;
            description?: string;
            stage?: any;
            tasks?: { title: string; description?: string; dueDays: number }[];
        },
        currentUser?: any,
    ) {
        const template = await prisma.lifecycleTemplate.findUnique({
            where: { id: templateId },
        });
        if (!template) throw new AppError("Template not found", 404);

        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (template.companyName && template.companyName !== currentUser.companyName) {
                throw new AppError("Unauthorized - Template belongs to another company", 403);
            }
        }

        if (payload.tasks) {
            await prisma.lifecycleTemplateTask.deleteMany({
                where: { templateId },
            });
        }

        return prisma.lifecycleTemplate.update({
            where: { id: templateId },
            data: {
                ...(payload.title ? { title: payload.title } : {}),
                ...(payload.description !== undefined ? { description: payload.description } : {}),
                ...(payload.stage ? { stage: payload.stage } : {}),
                ...(payload.tasks
                    ? {
                          tasks: {
                              create: payload.tasks.map((t) => ({
                                  title: t.title,
                                  description: t.description,
                                  dueDays: t.dueDays,
                              })),
                          },
                      }
                    : {}),
            },
            include: { tasks: true },
        });
    }

    async deleteTemplate(templateId: string, currentUser?: any) {
        const template = await prisma.lifecycleTemplate.findUnique({
            where: { id: templateId },
        });
        if (!template) throw new AppError("Template not found", 404);

        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (template.companyName && template.companyName !== currentUser.companyName) {
                throw new AppError("Unauthorized - Template belongs to another company", 403);
            }
        }

        return prisma.lifecycleTemplate.delete({
            where: { id: templateId },
        });
    }

    async applyTemplateToEmployee(employeeId: string, templateId: string) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee) throw new AppError("Employee profile not found", 404);

        const template = await prisma.lifecycleTemplate.findUnique({
            where: { id: templateId },
            include: { tasks: true },
        });
        if (!template) throw new AppError("Template not found", 404);

        const startDate = new Date();

        const checklistEntries = template.tasks.map((task) => {
            const dueDate = new Date(startDate);
            dueDate.setDate(dueDate.getDate() + task.dueDays);

            return prisma.employeeLifecycleChecklist.upsert({
                where: {
                    employeeId_taskId: {
                        employeeId,
                        taskId: task.id,
                    },
                },
                update: { dueDate },
                create: {
                    employeeId,
                    taskId: task.id,
                    dueDate,
                },
            });
        });

        return Promise.all(checklistEntries);
    }

    async updateChecklistStatus(checklistId: string, status: any) {
        return prisma.employeeLifecycleChecklist.update({
            where: { id: checklistId },
            data: {
                status,
                completedAt: status === "COMPLETED" ? new Date() : null,
            },
        });
    }

    async getEmployeeJourney(
        employeeId: string,
        filters?: { startDate?: string; endDate?: string; eventType?: string },
        currentUser?: any,
    ) {
        const employeeIncludes = {
            user: { select: { id: true, email: true, role: true, companyName: true } },
            department: { select: { name: true } },
            position: { select: { title: true } },
            manager: { select: { firstName: true, lastName: true } },
            lifecycleEvents: { orderBy: { eventDate: "desc" as const } },
            lifecycleChecklists: {
                include: { task: true },
            },
            courseProgresses: { include: { course: true } },
            certificates: { include: { course: true } },
            performanceReviews: true,
            promotions: {
                where: { status: { in: ["APPROVED_BY_HR", "APPROVED_BY_MANAGER"] } },
                include: { targetGrade: true, currentGrade: true },
            },
            careerHistories: {
                orderBy: { changedAt: "desc" as const },
            },
            objectives: {
                include: { keyResults: true },
                orderBy: { createdAt: "desc" as const },
            },
            discAssessments: {
                orderBy: { createdAt: "desc" as const },
            },
            feedbackTargets: {
                include: { cycle: true },
                orderBy: { createdAt: "desc" as const },
            },
            onboarding: {
                include: { tasks: { include: { task: true } }, mentor: true },
            },
            policySignatures: {
                include: { policy: true },
                orderBy: { signedAt: "desc" as const },
            },
            historyLogs: {
                include: {
                    changedBy: {
                        select: { firstName: true, lastName: true },
                    },
                },
            },
            offboarding: true,
        };

        let employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: employeeIncludes,
        });

        if (!employee) {
            employee = await prisma.employee.findUnique({
                where: { userId: employeeId },
                include: employeeIncludes,
            });
        }

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { id: true, role: true, companyName: true },
            });

            if (caller) {
                if (caller.role === "EMPLOYEE" && employee.userId !== caller.id) {
                    throw new AppError("Unauthorized to view this employee's journey", 403);
                }

                if (caller.role !== "SUPER_ADMIN" && caller.companyName) {
                    if (employee.user?.companyName && employee.user.companyName !== caller.companyName) {
                        throw new AppError("Unauthorized - Employee belongs to another company", 403);
                    }
                }
            }
        }

        let timeline: any[] = [];

        if (employee.user?.email) {
            const candidate = await prisma.candidate.findFirst({
                where: { email: employee.user.email },
                include: { primaryVacancy: true },
            });

            if (candidate) {
                timeline.push({
                    id: `cand_app_${candidate.id}`,
                    stage: "CANDIDATE_APPLIED",
                    title: `Nomzod arizasi topshirildi: ${candidate.primaryVacancy?.title || "Vakansiya"}`,
                    date: candidate.createdAt,
                    details: `Manba: ${candidate.source}. Rezyume topshirildi.`,
                    isCustom: false,
                });

                if (candidate.testTaskSubmittedAt) {
                    timeline.push({
                        id: `cand_task_${candidate.id}`,
                        stage: "ONBOARDING_STARTED",
                        title: "Test topshirig'i topshirildi",
                        date: candidate.testTaskSubmittedAt,
                        details: "Nomzodlik bosqichidagi texnik vazifa topshirildi va tekshirildi.",
                        isCustom: false,
                    });
                }
            }
        }

        timeline.push({
            id: `sys_hired_${employee.id}`,
            stage: "HIRED",
            title: "Ishga qabul qilindi",
            date: employee.createdAt,
            details: `${employee.firstName} ${employee.lastName} ${employee.department?.name ? employee.department.name + " bo'limiga" : ""} ${employee.position?.title ? employee.position.title + " lavozimiga" : ""} ishga qabul qilindi.`,
            isCustom: false,
        });

        if (employee.onboarding) {
            timeline.push({
                id: `sys_onb_${employee.onboarding.id}`,
                stage: "ONBOARDING_STARTED",
                title: "Moslashuv (Onboarding) dasturi boshlandi",
                date: employee.onboarding.createdAt,
                details: `Holati: ${employee.onboarding.status}.${employee.onboarding.mentor ? " Mentor: " + employee.onboarding.mentor.firstName + " " + employee.onboarding.mentor.lastName + "." : ""}`,
                isCustom: false,
            });

            if (employee.onboarding.status === "COMPLETED") {
                timeline.push({
                    id: `sys_onb_comp_${employee.onboarding.id}`,
                    stage: "ONBOARDING_COMPLETED",
                    title: "Onboarding to'liq yakunlandi",
                    date: employee.onboarding.updatedAt,
                    details: "Moslashuv dasturining barcha shartlari va vazifalari bajarildi.",
                    isCustom: false,
                });
            }

            if (employee.onboarding.tasks && employee.onboarding.tasks.length > 0) {
                employee.onboarding.tasks.forEach((t) => {
                    timeline.push({
                        id: `sys_onbtask_${t.id}`,
                        stage: "ONBOARDING_COMPLETED",
                        title: `Onboarding: ${t.task?.title || "Vazifa"}`,
                        date: t.completedAt || t.createdAt,
                        details: `Holat: ${t.status}. ${t.task?.description || ""}`,
                        isCustom: false,
                    });
                });
            }
        }

        if (employee.policySignatures && employee.policySignatures.length > 0) {
            employee.policySignatures.forEach((sig) => {
                timeline.push({
                    id: `sys_pol_${sig.id}`,
                    stage: "ONBOARDING_COMPLETED",
                    title: `Ichki nizom imzolandi: ${sig.policy.title}`,
                    date: sig.signedAt,
                    details: `Versiya: ${sig.policy.version}. Xodim ichki qoidalar bilan tanishdi va tasdiqladi.`,
                    isCustom: false,
                });
            });
        }

        if (employee.lifecycleEvents && employee.lifecycleEvents.length > 0) {
            employee.lifecycleEvents.forEach((item) => {
                timeline.push({
                    id: item.id,
                    stage: item.eventType,
                    title: item.title,
                    date: item.eventDate,
                    details: item.description || "",
                    metadata: item.metadata,
                    isCustom: true,
                });
            });
        }

        employee.lifecycleChecklists.forEach((item) => {
            timeline.push({
                id: `sys_check_${item.id}`,
                stage: "ONBOARDING_COMPLETED",
                title: `Onboarding vazifasi: ${item.task.title}`,
                date: item.completedAt || item.dueDate,
                details: `Holat: ${item.status}. ${item.task.description || ""}`,
                isCustom: false,
            });
        });

        if (employee.promotions && employee.promotions.length > 0) {
            employee.promotions.forEach((pr) => {
                timeline.push({
                    id: `sys_prom_${pr.id}`,
                    stage: "PROMOTED",
                    title: `Greyd ko'tarildi: ${pr.targetGrade?.title || "Yangi daraja"} (Level ${pr.targetGrade?.level || ""})`,
                    date: pr.updatedAt || pr.createdAt,
                    details: `Yangi greyd kodi: ${pr.targetGrade?.code || ""} • ${pr.targetGrade?.title || ""}`,
                    isCustom: false,
                });
            });
        }

        if (employee.careerHistories && employee.careerHistories.length > 0) {
            employee.careerHistories.forEach((ch) => {
                timeline.push({
                    id: `sys_ch_${ch.id}`,
                    stage: "PROMOTED",
                    title: `Greyd / Karyera o'zgarishi: ${ch.newGradeTitle}`,
                    date: ch.changedAt,
                    details: `Yangi greyd: ${ch.newGradeTitle}${ch.oldGradeTitle ? " (Oldingi: " + ch.oldGradeTitle + ")" : ""}. Yangi maosh: ${ch.newSalary.toLocaleString()} UZS. Sabab: ${ch.reason || "Karyera o'sishi"}`,
                    isCustom: false,
                });
            });
        }

        if (employee.objectives && employee.objectives.length > 0) {
            employee.objectives.forEach((obj) => {
                timeline.push({
                    id: `sys_okr_${obj.id}`,
                    stage: "PERFORMANCE_REVIEWED",
                    title: `OKR Maqsadi: ${obj.title}`,
                    date: obj.createdAt,
                    details: `Davr: ${obj.quarter} ${obj.year}. Bajarilishi: ${obj.progress}%. Holat: ${obj.status}. Key Results soni: ${obj.keyResults.length} ta.`,
                    isCustom: false,
                });
            });
        }

        employee.discAssessments.forEach((disc) => {
            const discTypeTitles: Record<string, string> = {
                D: "Dominance (Yetakchilik, qat'iyatlilik)",
                I: "Influence (Ta'sirchanlik, muloqotga kirishuvchanlik)",
                S: "Steadiness (Barqarorlik, jamoaviy birdamlik)",
                C: "Conscientiousness (Aniqlik, tahliliy yondashuv)",
            };
            const totalScore = (disc.dScore + disc.iScore + disc.sScore + disc.cScore) || 1;
            const dPercent = Math.round((disc.dScore / totalScore) * 100);
            const iPercent = Math.round((disc.iScore / totalScore) * 100);
            const sPercent = Math.round((disc.sScore / totalScore) * 100);
            const cPercent = Math.round((disc.cScore / totalScore) * 100);
            const primaryDesc = discTypeTitles[disc.primaryType] || disc.primaryType;

            timeline.push({
                id: `sys_disc_${disc.id}`,
                stage: "PERFORMANCE_REVIEWED",
                title: `DISC Testi topshirildi: ${disc.primaryType} tipi`,
                date: disc.createdAt,
                details: `Asosiy tip: ${primaryDesc}. Natijalar: D:${dPercent}% | I:${iPercent}% | S:${sPercent}% | C:${cPercent}%`,
                isCustom: false,
            });
        });

        if (employee.feedbackTargets && employee.feedbackTargets.length > 0) {
            employee.feedbackTargets.forEach((fb) => {
                timeline.push({
                    id: `sys_fb_${fb.id}`,
                    stage: "PERFORMANCE_REVIEWED",
                    title: `360 Baholash: ${fb.cycle.title}`,
                    date: fb.createdAt,
                    details: `Baholash sikli: ${fb.cycle.title}. Holati: ${fb.status}.`,
                    isCustom: false,
                });
            });
        }

        employee.historyLogs.forEach((log) => {
            timeline.push({
                id: `sys_hist_${log.id}`,
                stage: "DEPARTMENT_CHANGED",
                title: "Lavozim yoki Bo'lim o'zgardi",
                date: log.createdAt,
                details: `O'zgartiruvchi: ${log.changedBy.firstName} ${log.changedBy.lastName}. Sabab: ${log.reason || "Keltirilmagan"}`,
                isCustom: false,
            });
        });

        employee.certificates.forEach((cert) => {
            timeline.push({
                id: `sys_cert_${cert.id}`,
                stage: "CERTIFICATE_EARNED",
                title: `Sertifikat olindi: ${cert.course.title}`,
                date: cert.issuedAt,
                details: `Sertifikat raqami: #${cert.certificateNumber}`,
                isCustom: false,
            });
        });

        if (employee.courseProgresses && employee.courseProgresses.length > 0) {
            employee.courseProgresses
                .filter((cp) => cp.isCompleted)
                .forEach((cp) => {
                    timeline.push({
                        id: `sys_cp_${cp.id}`,
                        stage: "COURSE_COMPLETED",
                        title: `Akademiya kursi yakunlandi: ${cp.course.title}`,
                        date: cp.updatedAt,
                        details: `Kurs to'liq 100% muvaffaqiyatli yakunlandi.`,
                        isCustom: false,
                    });
                });
        }

        employee.performanceReviews.forEach((review) => {
            timeline.push({
                id: `sys_rev_${review.id}`,
                stage: "PERFORMANCE_REVIEWED",
                title: `KPI/Performance baholandi (${review.period})`,
                date: review.createdAt,
                details: `Baho: ${review.score}/5. Izoh: ${review.feedback || "Mavjud emas"}`,
                isCustom: false,
            });
        });

        if (employee.offboarding) {
            timeline.push({
                id: `sys_off_${employee.offboarding.id}`,
                stage: "OFFBOARDING_STARTED",
                title: "Offboarding (Ishdan ketish jarayoni)",
                date: employee.offboarding.createdAt,
                details: `Oxirgi ish kuni: ${employee.offboarding.lastWorkingDay ? new Date(employee.offboarding.lastWorkingDay).toISOString().split("T")[0] : "-"}. Sababi: ${employee.offboarding.reason}`,
                isCustom: false,
            });

            if (employee.offboarding.status === "COMPLETED") {
                timeline.push({
                    id: `sys_off_done_${employee.offboarding.id}`,
                    stage: "TERMINATED",
                    title: "Mehnat munosabatlari yakunlandi",
                    date: employee.offboarding.lastWorkingDay || employee.offboarding.updatedAt,
                    details: "Barcha topshiriqlar va hisob-kitoblar to'liq amalga oshirildi.",
                    isCustom: false,
                });
            }
        }

        if (filters?.startDate) {
            const start = new Date(filters.startDate).getTime();
            timeline = timeline.filter(
                (item) => new Date(item.date).getTime() >= start,
            );
        }

        if (filters?.endDate) {
            const end = new Date(filters.endDate).getTime();
            timeline = timeline.filter(
                (item) => new Date(item.date).getTime() <= end,
            );
        }

        if (filters?.eventType) {
            timeline = timeline.filter(
                (item) => item.stage === filters.eventType,
            );
        }

        timeline.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        const daysSinceHired = Math.floor(
            (new Date().getTime() - new Date(employee.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        const totalAssignedCourses = employee.courseProgresses?.length || 0;
        const completedCoursesCount =
            employee.courseProgresses?.filter((cp) => cp.isCompleted).length || 0;
        const allCoursesDone =
            totalAssignedCourses > 0 &&
            completedCoursesCount >= totalAssignedCourses;
        const onboardingTasksDone =
            (employee.onboarding?.tasks?.length || 0) > 0 &&
            employee.onboarding!.tasks.every((t: any) => t.isCompleted);
        const isOnboardingDone =
            employee.onboarding?.status === "COMPLETED" ||
            allCoursesDone ||
            onboardingTasksDone;

        const hasPerformanceOrOkr =
            (employee.objectives && employee.objectives.length > 0) ||
            (employee.discAssessments && employee.discAssessments.length > 0) ||
            (employee.performanceReviews && employee.performanceReviews.length > 0);

        const hasPromotionOrCert =
            (employee.promotions && employee.promotions.length > 0) ||
            (employee.certificates && employee.certificates.length > 0) ||
            (employee.feedbackTargets && employee.feedbackTargets.length > 0) ||
            (employee.careerHistories && employee.careerHistories.length > 0);

        let currentStageIndex = 1;
        if (employee.offboarding) {
            currentStageIndex = 6;
        } else if (hasPromotionOrCert) {
            currentStageIndex = 5;
        } else if (hasPerformanceOrOkr) {
            currentStageIndex = 4;
        } else if (isOnboardingDone || daysSinceHired > 30) {
            currentStageIndex = 3;
        } else {
            currentStageIndex = 2;
        }

        const stages = [
            {
                index: 0,
                code: "PRE_HIRE",
                title: "Nomzodlik & Tanlov",
                description: "Vakansiyaga ariza topshirish, suhbat va taklif (Offer)",
                icon: "📝",
                status: currentStageIndex > 0 ? "COMPLETED" : currentStageIndex === 0 ? "CURRENT" : "UPCOMING",
            },
            {
                index: 1,
                code: "HIRED",
                title: "Ishga Qabul & Hujjatlar",
                description: "Mehnat shartnomasi, tizimga kiritish va xodim ID ruxsatnomasi",
                icon: "🚀",
                status: currentStageIndex > 1 ? "COMPLETED" : currentStageIndex === 1 ? "CURRENT" : "UPCOMING",
            },
            {
                index: 2,
                code: "ONBOARDING",
                title: "Moslashuv (Onboarding)",
                description: "Ichki nizomlar, mentorlik va 1-oylik moslashuv dasturi",
                icon: "📚",
                status: currentStageIndex > 2 ? "COMPLETED" : currentStageIndex === 2 ? "CURRENT" : "UPCOMING",
            },
            {
                index: 3,
                code: "PROBATION",
                title: "Sinov Muddati (Probation)",
                description: "3-oylik sinov davri, oraliq topshiriqlar va yakuniy xulosa",
                icon: "🛡️",
                status: currentStageIndex > 3 ? "COMPLETED" : currentStageIndex === 3 ? "CURRENT" : "UPCOMING",
            },
            {
                index: 4,
                code: "REGULAR_WORK",
                title: "Asosiy Faoliyat & OKR",
                description: "Kvartallik OKR maqsadlari, DISC shaxsiyat testi va KPI",
                icon: "⭐",
                status: currentStageIndex > 4 ? "COMPLETED" : currentStageIndex === 4 ? "CURRENT" : "UPCOMING",
            },
            {
                index: 5,
                code: "PROMOTION",
                title: "Rivojlanish & Greyd O'sishi",
                description: "360 darajali baholash, Akademiya sertifikatlari va greyd oshirilishi",
                icon: "👑",
                status: currentStageIndex > 5 ? "COMPLETED" : currentStageIndex === 5 ? "CURRENT" : "UPCOMING",
            },
            {
                index: 6,
                code: "OFFBOARDING",
                title: "Offboarding & Yakun",
                description: "Yakuniy hisob-kitob, aktivlarni topshirish va exit interview",
                icon: "🏁",
                status: employee.offboarding?.status === "COMPLETED" ? "COMPLETED" : currentStageIndex === 6 ? "CURRENT" : "UPCOMING",
            },
        ];

        return {
            employee: {
                id: employee.id,
                fullName: `${employee.firstName} ${employee.lastName}`,
                department: employee.department?.name,
                position: employee.position?.title,
                manager: employee.manager
                    ? `${employee.manager.firstName} ${employee.manager.lastName}`
                    : null,
            },
            currentStage: stages[currentStageIndex]?.title || "Asosiy Faoliyat",
            currentStageIndex,
            stages,
            timeline,
        };
    }

    async createLifecycleEvent(
        employeeId: string,
        payload: {
            eventType: any;
            title: string;
            description?: string;
            eventDate?: string;
            metadata?: any;
        },
        currentUser?: any,
    ) {
        let employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { user: true },
        });

        if (!employee) {
            employee = await prisma.employee.findUnique({
                where: { userId: employeeId },
                include: { user: true },
            });
        }

        if (!employee) throw new AppError("Employee profile not found", 404);

        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN" && caller.companyName) {
                if (employee.user?.companyName && employee.user.companyName !== caller.companyName) {
                    throw new AppError("Unauthorized - Employee belongs to another company", 403);
                }
            }
        }

        return prisma.employeeLifecycleEvent.create({
            data: {
                employeeId: employee.id,
                eventType: payload.eventType,
                title: payload.title,
                description: payload.description,
                eventDate: payload.eventDate ? new Date(payload.eventDate) : new Date(),
                metadata: payload.metadata,
            },
        });
    }

    async updateLifecycleEvent(
        eventId: string,
        payload: {
            eventType?: any;
            title?: string;
            description?: string;
            eventDate?: string;
            metadata?: any;
        },
        currentUser?: any,
    ) {
        const event = await prisma.employeeLifecycleEvent.findUnique({
            where: { id: eventId },
            include: { employee: { include: { user: true } } },
        });

        if (!event) throw new AppError("Lifecycle event not found", 404);

        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN" && caller.companyName) {
                if (event.employee?.user?.companyName && event.employee.user.companyName !== caller.companyName) {
                    throw new AppError("Unauthorized - Event belongs to another company", 403);
                }
            }
        }

        return prisma.employeeLifecycleEvent.update({
            where: { id: eventId },
            data: {
                ...(payload.eventType ? { eventType: payload.eventType } : {}),
                ...(payload.title ? { title: payload.title } : {}),
                ...(payload.description !== undefined ? { description: payload.description } : {}),
                ...(payload.eventDate ? { eventDate: new Date(payload.eventDate) } : {}),
                ...(payload.metadata !== undefined ? { metadata: payload.metadata } : {}),
            },
        });
    }

    async deleteLifecycleEvent(eventId: string, currentUser?: any) {
        const event = await prisma.employeeLifecycleEvent.findUnique({
            where: { id: eventId },
            include: { employee: { include: { user: true } } },
        });

        if (!event) throw new AppError("Lifecycle event not found", 404);

        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN" && caller.companyName) {
                if (event.employee?.user?.companyName && event.employee.user.companyName !== caller.companyName) {
                    throw new AppError("Unauthorized - Event belongs to another company", 403);
                }
            }
        }

        return prisma.employeeLifecycleEvent.delete({
            where: { id: eventId },
        });
    }

    async getAllOffboardingRequests(currentUser?: any) {
        return prisma.offboardingRequest.findMany({
            where: {
                employee: {
                    user: {
                        ...(currentUser?.companyName ? { companyName: currentUser.companyName } : {}),
                    },
                },
            },
            include: {
                employee: {
                    include: {
                        department: true,
                        position: true,
                        user: {
                            select: { id: true, email: true, role: true, companyName: true },
                        },
                    },
                },
                tasks: {
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async startOffboarding(
        employeeIdentifier: string,
        payload: {
            reason: string;
            lastWorkingDay: string;
            exitInterviewNotes?: string;
        },
        currentUser?: any,
    ) {
        const employee = await prisma.employee.findFirst({
            where: {
                OR: [{ id: employeeIdentifier }, { userId: employeeIdentifier }],
            },
            include: { user: true },
        });

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        if (
            currentUser?.companyName &&
            employee.user?.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            employee.user.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const offboarding = await prisma.offboardingRequest.upsert({
            where: { employeeId: employee.id },
            update: {
                reason: payload.reason,
                lastWorkingDay: new Date(payload.lastWorkingDay),
                exitInterviewNotes: payload.exitInterviewNotes || undefined,
                status: "IN_PROGRESS",
            },
            create: {
                employeeId: employee.id,
                reason: payload.reason,
                lastWorkingDay: new Date(payload.lastWorkingDay),
                exitInterviewNotes: payload.exitInterviewNotes || undefined,
                status: "IN_PROGRESS",
            },
        });

        const existingTasksCount = await prisma.offboardingTaskItem.count({
            where: { offboardingId: offboarding.id },
        });

        if (existingTasksCount === 0) {
            const tasksToCreate =
                payload.customTasks && payload.customTasks.length > 0
                    ? payload.customTasks
                    : [
                          {
                              title: "IT tizimlaridan va korporativ pochtadan ruxsatni bekor qilish",
                              category: "IT_ACCESS" as const,
                          },
                          {
                              title: "Korporativ noutbuk, telefon va aksessuarlarni qaytarib olish",
                              category: "ASSET_RETURN" as const,
                          },
                          {
                              title: "ID karta, kalit va bino ruxsatnomalarini topshirish",
                              category: "ASSET_RETURN" as const,
                          },
                          {
                              title: "Yakuniy moliyaviy hisob-kitob va oylik maoshni to'lash",
                              category: "FINANCE" as const,
                          },
                          {
                              title: "Exit interview so'rovnomasini to'ldirish va hujjatlarni imzolash",
                              category: "HR_DOCUMENTS" as const,
                          },
                      ];

            for (const task of tasksToCreate) {
                await prisma.offboardingTaskItem.create({
                    data: {
                        offboardingId: offboarding.id,
                        title: task.title,
                        category: (task.category as any) || "HR_DOCUMENTS",
                    },
                });
            }
        }

        await prisma.employeeLifecycleEvent.create({
            data: {
                employeeId: employee.id,
                eventType: "OFFBOARDING_STARTED",
                title: "Offboarding jarayoni boshlandi",
                description: `Oxirgi ish kuni: ${new Date(payload.lastWorkingDay).toISOString().split("T")[0]}. Sababi: ${payload.reason}`,
            },
        });

        return prisma.offboardingRequest.findUnique({
            where: { id: offboarding.id },
            include: {
                employee: {
                    include: { department: true, position: true, user: true },
                },
                tasks: { orderBy: { createdAt: "asc" } },
            },
        });
    }

    async getOffboardingDetails(employeeIdentifier: string, currentUser?: any) {
        const employee = await prisma.employee.findFirst({
            where: {
                OR: [{ id: employeeIdentifier }, { userId: employeeIdentifier }],
            },
            include: { user: true },
        });

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        if (
            currentUser?.companyName &&
            employee.user?.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            employee.user.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const offboarding = await prisma.offboardingRequest.findUnique({
            where: { employeeId: employee.id },
            include: {
                employee: {
                    include: { department: true, position: true, user: true },
                },
                tasks: { orderBy: { createdAt: "asc" } },
            },
        });

        if (!offboarding) {
            return null;
        }

        return offboarding;
    }

    async editOffboardingTask(
        taskId: string,
        payload: { title?: string; category?: any; isCompleted?: boolean },
        currentUser?: any,
    ) {
        const existing = await prisma.offboardingTaskItem.findUnique({
            where: { id: taskId },
            include: {
                offboarding: {
                    include: {
                        employee: { include: { user: true } },
                    },
                },
            },
        });

        if (!existing) {
            throw new AppError("Topshiriq topilmadi", 404);
        }

        if (
            currentUser?.companyName &&
            existing.offboarding.employee.user?.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            existing.offboarding.employee.user.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const updated = await prisma.offboardingTaskItem.update({
            where: { id: taskId },
            data: {
                ...(payload.title ? { title: payload.title } : {}),
                ...(payload.category ? { category: payload.category } : {}),
                ...(typeof payload.isCompleted === "boolean"
                    ? {
                          isCompleted: payload.isCompleted,
                          completedAt: payload.isCompleted ? new Date() : null,
                      }
                    : {}),
            },
        });

        const allTasks = await prisma.offboardingTaskItem.findMany({
            where: { offboardingId: existing.offboardingId },
        });
        const allCompleted = allTasks.every((t) => t.isCompleted);

        await prisma.offboardingRequest.update({
            where: { id: existing.offboardingId },
            data: {
                status: allCompleted ? "COMPLETED" : "IN_PROGRESS",
                isAssetsReturned: allCompleted,
            },
        });

        return updated;
    }

    async updateOffboardingTask(taskId: string, isCompleted: boolean, currentUser?: any) {
        const existing = await prisma.offboardingTaskItem.findUnique({
            where: { id: taskId },
            include: {
                offboarding: {
                    include: {
                        employee: { include: { user: true } },
                    },
                },
            },
        });

        if (!existing) {
            throw new AppError("Topshiriq topilmadi", 404);
        }

        if (
            currentUser?.companyName &&
            existing.offboarding.employee.user?.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            existing.offboarding.employee.user.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const task = await prisma.offboardingTaskItem.update({
            where: { id: taskId },
            data: {
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
            },
        });

        const allTasks = await prisma.offboardingTaskItem.findMany({
            where: { offboardingId: task.offboardingId },
        });

        const allCompleted = allTasks.every((t) => t.isCompleted);

        await prisma.offboardingRequest.update({
            where: { id: task.offboardingId },
            data: {
                status: allCompleted ? "COMPLETED" : "IN_PROGRESS",
                isAssetsReturned: allCompleted,
            },
        });

        if (allCompleted) {
            await prisma.employeeLifecycleEvent.create({
                data: {
                    employeeId: existing.offboarding.employeeId,
                    eventType: "TERMINATED",
                    title: "Offboarding muvaffaqiyatli yakunlandi",
                    description: "Barcha aylanma varaqasi (Checklist) topshiriqlari va aktivlar to'liq topshirildi.",
                },
            });
        }

        return task;
    }

    async addOffboardingTask(
        offboardingId: string,
        payload: { title: string; category?: any },
        currentUser?: any,
    ) {
        const offboarding = await prisma.offboardingRequest.findUnique({
            where: { id: offboardingId },
            include: { employee: { include: { user: true } } },
        });

        if (!offboarding) {
            throw new AppError("Offboarding arizasi topilmadi", 404);
        }

        if (
            currentUser?.companyName &&
            offboarding.employee.user?.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            offboarding.employee.user.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return prisma.offboardingTaskItem.create({
            data: {
                offboardingId,
                title: payload.title,
                category: payload.category || "HR_DOCUMENTS",
            },
        });
    }

    async deleteOffboardingTask(taskId: string, currentUser?: any) {
        const task = await prisma.offboardingTaskItem.findUnique({
            where: { id: taskId },
            include: { offboarding: { include: { employee: { include: { user: true } } } } },
        });

        if (!task) {
            throw new AppError("Topshiriq topilmadi", 404);
        }

        if (
            currentUser?.companyName &&
            task.offboarding.employee.user?.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            task.offboarding.employee.user.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return prisma.offboardingTaskItem.delete({
            where: { id: taskId },
        });
    }

    async submitExitInterview(
        employeeIdentifier: string,
        payload: { exitInterviewNotes: string; reason?: string },
        currentUser?: any,
    ) {
        const employee = await prisma.employee.findFirst({
            where: {
                OR: [{ id: employeeIdentifier }, { userId: employeeIdentifier }],
            },
            include: { user: true },
        });

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        if (
            currentUser?.companyName &&
            employee.user?.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            employee.user.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const offboarding = await prisma.offboardingRequest.upsert({
            where: { employeeId: employee.id },
            update: {
                exitInterviewNotes: payload.exitInterviewNotes,
                ...(payload.reason ? { reason: payload.reason } : {}),
            },
            create: {
                employeeId: employee.id,
                reason: payload.reason || "Ishdan bo'shash",
                lastWorkingDay: new Date(),
                exitInterviewNotes: payload.exitInterviewNotes,
                status: "IN_PROGRESS",
            },
            include: {
                employee: { include: { department: true, position: true, user: true } },
                tasks: true,
            },
        });

        const exitTask = await prisma.offboardingTaskItem.findFirst({
            where: {
                offboardingId: offboarding.id,
                category: "HR_DOCUMENTS",
            },
        });

        if (exitTask) {
            await prisma.offboardingTaskItem.update({
                where: { id: exitTask.id },
                data: { isCompleted: true, completedAt: new Date() },
            });
        }

        await prisma.employeeLifecycleEvent.create({
            data: {
                employeeId: employee.id,
                eventType: "EXIT_INTERVIEW_COMPLETED",
                title: "Exit Interview topshirildi",
                description: payload.exitInterviewNotes.slice(0, 200),
            },
        });

        return offboarding;
    }

    async updateOffboardingStatus(
        offboardingId: string,
        status: any,
        currentUser?: any,
    ) {
        const offboarding = await prisma.offboardingRequest.findUnique({
            where: { id: offboardingId },
            include: { employee: { include: { user: true } } },
        });

        if (!offboarding) {
            throw new AppError("Offboarding topilmadi", 404);
        }

        if (
            currentUser?.companyName &&
            offboarding.employee.user?.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            offboarding.employee.user.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return prisma.offboardingRequest.update({
            where: { id: offboardingId },
            data: {
                status,
                ...(status === "COMPLETED" ? { isAssetsReturned: true } : {}),
            },
            include: { tasks: true },
        });
    }

    async exportEmployeeJourneyCSV(
        employeeId: string,
        filters?: { startDate?: string; endDate?: string; eventType?: string },
    ) {
        const journey = await this.getEmployeeJourney(employeeId, filters);

        const headers = [
            "Hodisa Turi (Stage)",
            "Sana",
            "Sarlavha",
            "Tafsilotlar",
        ];
        const rows = journey.timeline.map((item) => [
            `"${item.stage}"`,
            `"${new Date(item.date).toISOString().split("T")[0]}"`,
            `"${item.title.replace(/"/g, '""')}"`,
            `"${item.details.replace(/"/g, '""')}"`,
        ]);

        const csvContent = [
            `"Xodim: ${journey.employee.fullName}"`,
            `"Bo'lim: ${journey.employee.department || "Noll"}"`,
            `"Lavozim: ${journey.employee.position || "Noll"}"`,
            "",
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");

        return {
            filename: `lifecycle_${journey.employee.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
            csvContent,
        };
    }
}

export const lifecycleService = new LifecycleService();

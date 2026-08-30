import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { notificationService } from "../notification/notification-service";

export class OkrService {
    async createCycle(
        payload: {
            title: string;
            startDate: string;
            endDate: string;
            isCurrent?: boolean;
            minExpectedProgress?: number;
        },
        currentUser?: any,
    ) {
        let companyName: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller?.companyName) {
                companyName = caller.companyName;
            }
        }

        if (payload.isCurrent) {
            await prisma.okrCycle.updateMany({
                where: {
                    isCurrent: true,
                    ...(companyName ? { companyName } : {}),
                },
                data: { isCurrent: false },
            });
        }

        return prisma.okrCycle.create({
            data: {
                title: payload.title,
                startDate: new Date(payload.startDate),
                endDate: new Date(payload.endDate),
                isCurrent: payload.isCurrent ?? false,
                minExpectedProgress: payload.minExpectedProgress ?? 0.0,
                companyName,
            },
        });
    }

    async getCycles(currentUser?: any) {
        let companyFilter: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }

        return prisma.okrCycle.findMany({
            where: companyFilter ? { companyName: companyFilter } : {},
            orderBy: { startDate: "desc" },
        });
    }

    async createObjective(
        payload: {
            cycleId: string;
            level: "COMPANY" | "DEPARTMENT" | "INDIVIDUAL";
            title: string;
            description?: string;
            departmentId?: string;
            employeeId?: string;
            parentId?: string;
            minExpectedProgress?: number;
            isIndividualForEach?: boolean;
            keyResults: {
                title: string;
                initialValue?: number;
                targetValue: number;
                unit?: string;
            }[];
        },
        currentUser?: any,
    ) {
        let companyName: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller?.companyName) {
                companyName = caller.companyName;
            }
        }

        if (payload.isIndividualForEach && payload.level === "DEPARTMENT" && payload.departmentId) {
            const deptEmployees = await prisma.employee.findMany({
                where: {
                    departmentId: payload.departmentId,
                    user: {
                        role: { notIn: ["SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"] },
                        ...(companyName ? { companyName } : {}),
                    },
                },
                include: { user: true },
            });
            const createdObjectives = [];
            for (const emp of deptEmployees) {
                const indObj = await prisma.objective.create({
                    data: {
                        cycleId: payload.cycleId,
                        level: "INDIVIDUAL",
                        title: payload.title,
                        description: payload.description,
                        departmentId: payload.departmentId,
                        employeeId: emp.id,
                        parentId: payload.parentId,
                        minExpectedProgress: payload.minExpectedProgress,
                        companyName,
                        keyResults: {
                            create: (payload.keyResults || []).map((kr) => ({
                                title: kr.title,
                                initialValue: kr.initialValue ?? 0,
                                currentValue: kr.initialValue ?? 0,
                                targetValue: kr.targetValue,
                                unit: kr.unit ?? "%",
                                progress: 0,
                            })),
                        },
                    },
                    include: { keyResults: true },
                });
                createdObjectives.push(indObj);
                if (emp.userId) {
                    await notificationService.createAndSendNotification({
                        userId: emp.userId,
                        title: "Yangi OKR Maqsadi (Alohida hisobot)",
                        message: `Sizga shaxsiy hisobotli yangi OKR maqsadi biriktirildi: ${payload.title}`,
                        type: "GENERAL",
                        metadata: { type: "OKR_ASSIGNED", objectiveId: indObj.id },
                    }).catch(() => {});
                }
            }
            return createdObjectives[0] || null;
        }

        if (payload.isIndividualForEach && payload.level === "COMPANY") {
            const allEmployees = await prisma.employee.findMany({
                where: {
                    user: {
                        role: { notIn: ["SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"] },
                        ...(companyName ? { companyName } : {}),
                    },
                },
                include: { user: true },
            });
            const createdObjectives = [];
            for (const emp of allEmployees) {
                const indObj = await prisma.objective.create({
                    data: {
                        cycleId: payload.cycleId,
                        level: "INDIVIDUAL",
                        title: payload.title,
                        description: payload.description,
                        departmentId: emp.departmentId,
                        employeeId: emp.id,
                        parentId: payload.parentId,
                        minExpectedProgress: payload.minExpectedProgress,
                        companyName,
                        keyResults: {
                            create: (payload.keyResults || []).map((kr) => ({
                                title: kr.title,
                                initialValue: kr.initialValue ?? 0,
                                currentValue: kr.initialValue ?? 0,
                                targetValue: kr.targetValue,
                                unit: kr.unit ?? "%",
                                progress: 0,
                            })),
                        },
                    },
                    include: { keyResults: true },
                });
                createdObjectives.push(indObj);
                if (emp.userId) {
                    await notificationService.createAndSendNotification({
                        userId: emp.userId,
                        title: "Yangi OKR Maqsadi (Alohida hisobot)",
                        message: `Sizga shaxsiy hisobotli yangi OKR maqsadi biriktirildi: ${payload.title}`,
                        type: "GENERAL",
                        metadata: { type: "OKR_ASSIGNED", objectiveId: indObj.id },
                    }).catch(() => {});
                }
            }
            return createdObjectives[0] || null;
        }

        let resolvedEmployeeId = payload.employeeId;
        let resolvedUserId: string | null = null;

        if (payload.level === "INDIVIDUAL" && payload.employeeId) {
            const emp = await prisma.employee.findFirst({
                where: {
                    OR: [
                        { id: payload.employeeId },
                        { userId: payload.employeeId },
                    ],
                },
                select: { id: true, userId: true },
            });
            if (emp) {
                resolvedEmployeeId = emp.id;
                resolvedUserId = emp.userId;
            }
        }

        const objective = await prisma.objective.create({
            data: {
                cycleId: payload.cycleId,
                level: payload.level,
                title: payload.title,
                description: payload.description,
                departmentId: payload.level === "DEPARTMENT" ? (payload.departmentId || null) : null,
                employeeId: payload.level === "INDIVIDUAL" ? (resolvedEmployeeId || null) : null,
                parentId: payload.parentId || null,
                minExpectedProgress: payload.minExpectedProgress,
                companyName,
                keyResults: {
                    create: (payload.keyResults || []).map((kr) => ({
                        title: kr.title,
                        initialValue: kr.initialValue ?? 0,
                        currentValue: kr.initialValue ?? 0,
                        targetValue: kr.targetValue,
                        unit: kr.unit ?? "%",
                        progress: 0,
                    })),
                },
            },
            include: {
                keyResults: true,
            },
        });

        if (payload.level === "INDIVIDUAL" && resolvedUserId) {
            await notificationService.createAndSendNotification({
                userId: resolvedUserId,
                title: "Yangi OKR Maqsadi",
                message: `Sizga yangi OKR maqsadi biriktirildi: ${payload.title}`,
                type: "GENERAL",
                metadata: { type: "OKR_ASSIGNED", objectiveId: objective.id },
            }).catch(() => {});
        } else if (payload.level === "DEPARTMENT" && payload.departmentId) {
            const deptEmployees = await prisma.employee.findMany({
                where: { departmentId: payload.departmentId },
                select: { userId: true },
            });
            for (const deptEmp of deptEmployees) {
                if (deptEmp.userId) {
                    await notificationService.createAndSendNotification({
                        userId: deptEmp.userId,
                        title: "Bo'lim OKR Maqsadi",
                        message: `Bo'limingizga yangi OKR maqsadi biriktirildi: ${payload.title}`,
                        type: "GENERAL",
                        metadata: { type: "OKR_ASSIGNED", objectiveId: objective.id },
                    }).catch(() => {});
                }
            }
        } else if (payload.level === "COMPANY") {
            const allUsers = await prisma.user.findMany({
                where: {
                    role: { notIn: ["SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"] },
                    ...(companyName ? { companyName } : {}),
                },
                select: { id: true },
            });
            for (const u of allUsers) {
                await notificationService.createAndSendNotification({
                    userId: u.id,
                    title: "Kompaniya OKR Maqsadi",
                    message: `Kompaniya bo'yicha yangi OKR maqsadi belgilandi: ${payload.title}`,
                    type: "GENERAL",
                    metadata: { type: "OKR_ASSIGNED", objectiveId: objective.id },
                }).catch(() => {});
            }
        }

        return objective;
    }

    async updateObjective(
        objectiveId: string,
        payload: {
            level?: "COMPANY" | "DEPARTMENT" | "INDIVIDUAL";
            title?: string;
            description?: string;
            departmentId?: string | null;
            employeeId?: string | null;
            parentId?: string | null;
            minExpectedProgress?: number | null;
            keyResults?: {
                id?: string;
                title: string;
                initialValue?: number;
                targetValue: number;
                unit?: string;
            }[];
        }
    ) {
        const objective = await prisma.objective.findUnique({
            where: { id: objectiveId },
            include: { keyResults: true },
        });

        if (!objective) throw new AppError("Objective not found", 404);

        let resolvedEmployeeId = payload.employeeId;
        let resolvedUserId: string | null = null;

        if (payload.level === "INDIVIDUAL" && payload.employeeId) {
            const emp = await prisma.employee.findFirst({
                where: {
                    OR: [
                        { id: payload.employeeId },
                        { userId: payload.employeeId },
                    ],
                },
                select: { id: true, userId: true },
            });
            if (emp) {
                resolvedEmployeeId = emp.id;
                resolvedUserId = emp.userId;
            }
        }

        const updateData: any = {
            level: payload.level,
            title: payload.title,
            description: payload.description,
            departmentId: payload.level === "DEPARTMENT" ? (payload.departmentId || null) : null,
            employeeId: payload.level === "INDIVIDUAL" ? (resolvedEmployeeId || null) : null,
            parentId: payload.parentId,
            minExpectedProgress: payload.minExpectedProgress,
        };

        if (payload.keyResults) {
            const currentKrIds = objective.keyResults.map(k => k.id);
            const updatedKrIds = payload.keyResults.filter(k => k.id).map(k => k.id as string);
            const toDelete = currentKrIds.filter(id => !updatedKrIds.includes(id));

            if (toDelete.length > 0) {
                await prisma.keyResult.deleteMany({
                    where: { id: { in: toDelete } }
                });
            }

            updateData.keyResults = {
                upsert: payload.keyResults.map((kr) => ({
                    where: { id: kr.id || "new-id" },
                    create: {
                        title: kr.title,
                        initialValue: kr.initialValue ?? 0,
                        currentValue: kr.initialValue ?? 0,
                        targetValue: kr.targetValue,
                        unit: kr.unit ?? "%",
                        progress: 0,
                    },
                    update: {
                        title: kr.title,
                        targetValue: kr.targetValue,
                        unit: kr.unit,
                    }
                }))
            };
        }

        const updated = await prisma.objective.update({
            where: { id: objectiveId },
            data: updateData,
            include: { keyResults: true }
        });
        
        await this.recalculateObjectiveProgress(objectiveId);

        if (payload.level === "INDIVIDUAL" && resolvedUserId) {
            await notificationService.createAndSendNotification({
                userId: resolvedUserId,
                title: "Yangi OKR Maqsadi",
                message: `Sizga yangi OKR maqsadi biriktirildi: ${updated.title}`,
                type: "GENERAL",
                metadata: { type: "OKR_ASSIGNED", objectiveId: updated.id },
            }).catch(() => {});
        } else if (payload.level === "DEPARTMENT" && payload.departmentId) {
            const deptEmployees = await prisma.employee.findMany({
                where: { departmentId: payload.departmentId },
                select: { userId: true },
            });
            for (const deptEmp of deptEmployees) {
                if (deptEmp.userId) {
                    await notificationService.createAndSendNotification({
                        userId: deptEmp.userId,
                        title: "Bo'lim OKR Maqsadi",
                        message: `Bo'limingizga yangi OKR maqsadi biriktirildi: ${updated.title}`,
                        type: "GENERAL",
                        metadata: { type: "OKR_ASSIGNED", objectiveId: updated.id },
                    }).catch(() => {});
                }
            }
        } else if (payload.level === "COMPANY") {
            const allUsers = await prisma.user.findMany({
                where: {
                    role: { notIn: ["SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"] },
                    ...(existing.companyName ? { companyName: existing.companyName } : {}),
                },
                select: { id: true },
            });
            for (const u of allUsers) {
                await notificationService.createAndSendNotification({
                    userId: u.id,
                    title: "Kompaniya OKR Maqsadi",
                    message: `Kompaniya bo'yicha yangi OKR maqsadi belgilandi: ${updated.title}`,
                    type: "GENERAL",
                    metadata: { type: "OKR_ASSIGNED", objectiveId: updated.id },
                }).catch(() => {});
            }
        }

        return updated;
    }

    async deleteObjective(objectiveId: string) {
        return prisma.objective.delete({
            where: { id: objectiveId },
        });
    }

    async checkInKeyResult(
        keyResultId: string,
        comment?: string,
        imageUrl?: string,
        userId?: string,
    ) {
        const kr = await prisma.keyResult.findUnique({
            where: { id: keyResultId },
            include: { objective: { include: { employee: true } } },
        });

        if (!kr) throw new AppError("Key Result not found", 404);

        const value = kr.targetValue;

        const checkIn = await prisma.okrCheckIn.create({
            data: {
                keyResultId,
                value,
                comment,
                imageUrl,
                status: "PENDING",
                createdById: userId || "SYSTEM",
            },
        });

        let empName = "Xodim";
        if (userId) {
            const submittingUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { employee: true },
            });
            if (submittingUser?.employee) {
                empName = `${submittingUser.employee.firstName} ${submittingUser.employee.lastName}`.trim();
            }
        } else if (kr.objective.employee) {
            empName = `${kr.objective.employee.firstName} ${kr.objective.employee.lastName}`.trim();
        }

        let objCompany = kr.objective.companyName;
        if (!objCompany && userId) {
            const caller = await prisma.user.findUnique({
                where: { id: userId },
                select: { companyName: true },
            });
            if (caller?.companyName) {
                objCompany = caller.companyName;
            }
        }

        const hrAdminsAndDirectors = await prisma.user.findMany({
            where: {
                role: { in: ["HR_ADMIN", "DIRECTOR"] },
                ...(objCompany ? { companyName: objCompany } : {}),
            },
            select: { id: true },
        });

        for (const admin of hrAdminsAndDirectors) {
            await notificationService.createAndSendNotification({
                userId: admin.id,
                title: "OKR Natijasi Topshirildi",
                message: `${empName} '${kr.title}' vazifasi bo'yicha OKR natijasini topshirdi. Iltimos, tekshiring.`,
                type: "GENERAL",
                metadata: {
                    type: "OKR_CHECKIN_SUBMITTED",
                    keyResultId,
                    checkInId: checkIn.id,
                },
            }).catch(() => {});
        }

        return prisma.keyResult.findUnique({
            where: { id: keyResultId },
            include: { checkIns: { orderBy: { createdAt: "desc" } } },
        });
    }

    async getPendingCheckIns(currentUser?: any) {
        let companyFilter: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }

        return prisma.okrCheckIn.findMany({
            where: {
                status: "PENDING",
                ...(companyFilter
                    ? {
                          keyResult: {
                              objective: {
                                  companyName: companyFilter,
                              },
                          },
                      }
                    : {}),
            },
            include: {
                keyResult: {
                    include: {
                        objective: {
                            include: {
                                employee: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async reviewCheckIn(checkInId: string, status: "APPROVED" | "REJECTED") {
        const checkIn = await prisma.okrCheckIn.findUnique({
            where: { id: checkInId },
            include: {
                keyResult: {
                    include: {
                        objective: {
                            include: { employee: true },
                        },
                    },
                },
            },
        });

        if (!checkIn) throw new AppError("Check-in not found", 404);
        if (checkIn.status !== "PENDING") throw new AppError("Check-in is already reviewed", 400);

        await prisma.okrCheckIn.update({
            where: { id: checkInId },
            data: { status }
        });

        if (status === "APPROVED") {
            const kr = checkIn.keyResult;
            
            await prisma.keyResult.update({
                where: { id: kr.id },
                data: {
                    currentValue: kr.targetValue,
                    progress: 100,
                },
            });

            await this.recalculateObjectiveProgress(kr.objectiveId);
        }

        let targetUserId = checkIn.createdById !== "SYSTEM" ? checkIn.createdById : null;
        if (!targetUserId && checkIn.keyResult.objective.employee?.userId) {
            targetUserId = checkIn.keyResult.objective.employee.userId;
        }

        if (targetUserId) {
            await notificationService.createAndSendNotification({
                userId: targetUserId,
                title: status === "APPROVED" ? "OKR Natijangiz Tasdiqlandi" : "OKR Natijangiz Qaytarildi",
                message: status === "APPROVED"
                    ? `'${checkIn.keyResult.title}' bo'yicho yuborgan OKR natijangiz tasdiqlandi.`
                    : `'${checkIn.keyResult.title}' bo'yicho yuborgan OKR natijangiz rad etildi.`,
                type: "GENERAL",
                metadata: {
                    type: "OKR_CHECKIN_REVIEWED",
                    checkInId,
                    status,
                },
            }).catch(() => {});
        }

        return prisma.okrCheckIn.findUnique({
            where: { id: checkInId },
            include: { keyResult: true }
        });
    }

    private async recalculateObjectiveProgress(objectiveId: string) {
        const objective = await prisma.objective.findUnique({
            where: { id: objectiveId },
            include: { keyResults: true },
        });

        if (!objective || objective.keyResults.length === 0) return;

        const totalProgress = objective.keyResults.reduce(
            (acc, kr) => acc + kr.progress,
            0,
        );
        const avgProgress = totalProgress / objective.keyResults.length;

        await prisma.objective.update({
            where: { id: objectiveId },
            data: { progress: avgProgress },
        });

        if (objective.parentId) {
            await this.recalculateObjectiveProgress(objective.parentId);
        }
    }

    async updateObjectiveStatus(
        objectiveId: string,
        status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED",
    ) {
        return prisma.objective.update({
            where: { id: objectiveId },
            data: { status },
        });
    }

    async getDashboard(cycleId?: string, departmentId?: string, currentUser?: any) {
        let companyFilter: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }

        let activeCycleId = cycleId;

        if (!activeCycleId) {
            const currentCycle = await prisma.okrCycle.findFirst({
                where: {
                    isCurrent: true,
                    ...(companyFilter ? { companyName: companyFilter } : {}),
                },
            });
            activeCycleId = currentCycle?.id;
        }

        const where: any = {};
        if (activeCycleId) where.cycleId = activeCycleId;
        if (departmentId) where.departmentId = departmentId;
        if (companyFilter) where.companyName = companyFilter;

        const objectives = await prisma.objective.findMany({
            where,
            include: {
                keyResults: {
                    include: {
                        checkIns: { orderBy: { createdAt: "desc" }, take: 1 },
                    },
                },
                department: { select: { name: true } },
                employee: { select: { firstName: true, lastName: true } },
                children: {
                    select: {
                        id: true,
                        title: true,
                        progress: true,
                        level: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        const companyObjectives = objectives.filter(
            (o) => o.level === "COMPANY",
        );
        const departmentObjectives = objectives.filter(
            (o) => o.level === "DEPARTMENT",
        );
        const individualObjectives = objectives.filter(
            (o) => o.level === "INDIVIDUAL",
        );

        const calcAvg = (arr: typeof objectives) =>
            arr.length > 0
                ? arr.reduce((acc, o) => acc + o.progress, 0) / arr.length
                : 0;

        return {
            cycleId: activeCycleId,
            summary: {
                overallCompanyProgress: calcAvg(companyObjectives),
                overallDepartmentProgress: calcAvg(departmentObjectives),
                overallIndividualProgress: calcAvg(individualObjectives),
            },
            tree: {
                company: companyObjectives,
                department: departmentObjectives,
                individual: individualObjectives,
            },
        };
    }
}

export const okrService = new OkrService();

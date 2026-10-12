"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.okrService = exports.OkrService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
const notification_service_1 = require("../notification/notification-service");
class OkrService {
    async createCycle(payload, currentUser) {
        let companyName = null;
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller?.companyName) {
                companyName = caller.companyName;
            }
        }
        if (payload.isCurrent) {
            await db_1.default.okrCycle.updateMany({
                where: {
                    isCurrent: true,
                    ...(companyName ? { companyName } : {}),
                },
                data: { isCurrent: false },
            });
        }
        return db_1.default.okrCycle.create({
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
    async getCycles(currentUser) {
        let companyFilter = null;
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }
        return db_1.default.okrCycle.findMany({
            where: companyFilter ? { companyName: companyFilter } : {},
            orderBy: { startDate: "desc" },
        });
    }
    async createObjective(payload, currentUser) {
        let companyName = null;
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller?.companyName) {
                companyName = caller.companyName;
            }
        }
        let resolvedEmployeeId = payload.employeeId;
        let resolvedUserId = null;
        if (payload.level === "INDIVIDUAL" && payload.employeeId) {
            const emp = await db_1.default.employee.findFirst({
                where: {
                    OR: [
                        { id: payload.employeeId },
                        { userId: payload.employeeId },
                    ],
                },
                include: { user: true },
            });
            if (emp) {
                resolvedEmployeeId = emp.id;
                resolvedUserId = emp.userId;
                if (!companyName && emp.user?.companyName) {
                    companyName = emp.user.companyName;
                }
            }
        }
        let cycleId = payload.cycleId;
        if (!cycleId) {
            let currentCycle = await db_1.default.okrCycle.findFirst({
                where: {
                    isCurrent: true,
                    ...(companyName ? { companyName } : {}),
                },
            });
            if (!currentCycle) {
                currentCycle = await db_1.default.okrCycle.findFirst({
                    where: companyName ? { companyName } : {},
                    orderBy: { startDate: "desc" },
                });
            }
            if (!currentCycle) {
                const now = new Date();
                const quarterEnd = new Date(now.getFullYear(), now.getMonth() + 3, 0);
                currentCycle = await db_1.default.okrCycle.create({
                    data: {
                        title: `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()} Sikl`,
                        startDate: now,
                        endDate: quarterEnd,
                        isCurrent: true,
                        companyName,
                    },
                });
            }
            cycleId = currentCycle.id;
        }
        const rawKrs = (payload.keyResults && payload.keyResults.length > 0)
            ? payload.keyResults
            : [{ title: payload.title || "Asosiy vazifa ijrosi", initialValue: 0, targetValue: 100, unit: "%" }];
        if (payload.isIndividualForEach && payload.level === "DEPARTMENT" && payload.departmentId) {
            const deptEmployees = await db_1.default.employee.findMany({
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
                const indObj = await db_1.default.objective.create({
                    data: {
                        cycleId: cycleId,
                        level: "INDIVIDUAL",
                        title: payload.title,
                        description: payload.description,
                        departmentId: payload.departmentId,
                        employeeId: emp.id,
                        parentId: payload.parentId,
                        minExpectedProgress: payload.minExpectedProgress,
                        companyName,
                        keyResults: {
                            create: rawKrs.map((kr) => ({
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
                    await notification_service_1.notificationService.createAndSendNotification({
                        userId: emp.userId,
                        title: "Yangi OKR Maqsadi (Alohida hisobot)",
                        message: `Sizga shaxsiy hisobotli yangi OKR maqsadi biriktirildi: ${payload.title}`,
                        type: "GENERAL",
                        metadata: { type: "OKR_ASSIGNED", objectiveId: indObj.id },
                    }).catch(() => { });
                }
            }
            return createdObjectives[0] || null;
        }
        if (payload.isIndividualForEach && payload.level === "COMPANY") {
            const allEmployees = await db_1.default.employee.findMany({
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
                const indObj = await db_1.default.objective.create({
                    data: {
                        cycleId: cycleId,
                        level: "INDIVIDUAL",
                        title: payload.title,
                        description: payload.description,
                        departmentId: emp.departmentId,
                        employeeId: emp.id,
                        parentId: payload.parentId,
                        minExpectedProgress: payload.minExpectedProgress,
                        companyName,
                        keyResults: {
                            create: rawKrs.map((kr) => ({
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
                    await notification_service_1.notificationService.createAndSendNotification({
                        userId: emp.userId,
                        title: "Yangi OKR Maqsadi (Alohida hisobot)",
                        message: `Sizga shaxsiy hisobotli yangi OKR maqsadi biriktirildi: ${payload.title}`,
                        type: "GENERAL",
                        metadata: { type: "OKR_ASSIGNED", objectiveId: indObj.id },
                    }).catch(() => { });
                }
            }
            return createdObjectives[0] || null;
        }
        const objective = await db_1.default.objective.create({
            data: {
                cycleId: cycleId,
                level: payload.level,
                title: payload.title,
                description: payload.description,
                departmentId: payload.level === "DEPARTMENT" ? (payload.departmentId || null) : null,
                employeeId: payload.level === "INDIVIDUAL" ? (resolvedEmployeeId || null) : null,
                parentId: payload.parentId || null,
                minExpectedProgress: payload.minExpectedProgress,
                companyName,
                keyResults: {
                    create: rawKrs.map((kr) => ({
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
            await notification_service_1.notificationService.createAndSendNotification({
                userId: resolvedUserId,
                title: "Yangi OKR Maqsadi",
                message: `Sizga yangi OKR maqsadi biriktirildi: ${payload.title}`,
                type: "GENERAL",
                metadata: { type: "OKR_ASSIGNED", objectiveId: objective.id },
            }).catch(() => { });
        }
        else if (payload.level === "DEPARTMENT" && payload.departmentId) {
            const deptEmployees = await db_1.default.employee.findMany({
                where: { departmentId: payload.departmentId },
                select: { userId: true },
            });
            for (const deptEmp of deptEmployees) {
                if (deptEmp.userId) {
                    await notification_service_1.notificationService.createAndSendNotification({
                        userId: deptEmp.userId,
                        title: "Bo'lim OKR Maqsadi",
                        message: `Bo'limingizga yangi OKR maqsadi biriktirildi: ${payload.title}`,
                        type: "GENERAL",
                        metadata: { type: "OKR_ASSIGNED", objectiveId: objective.id },
                    }).catch(() => { });
                }
            }
        }
        else if (payload.level === "COMPANY") {
            const allUsers = await db_1.default.user.findMany({
                where: {
                    role: { notIn: ["SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"] },
                    ...(companyName ? { companyName } : {}),
                },
                select: { id: true },
            });
            for (const u of allUsers) {
                await notification_service_1.notificationService.createAndSendNotification({
                    userId: u.id,
                    title: "Kompaniya OKR Maqsadi",
                    message: `Kompaniya bo'yicha yangi OKR maqsadi belgilandi: ${payload.title}`,
                    type: "GENERAL",
                    metadata: { type: "OKR_ASSIGNED", objectiveId: objective.id },
                }).catch(() => { });
            }
        }
        return objective;
    }
    async updateObjective(objectiveId, payload) {
        const objective = await db_1.default.objective.findUnique({
            where: { id: objectiveId },
            include: { keyResults: true },
        });
        if (!objective)
            throw new appError_1.AppError("Objective not found", 404);
        let resolvedEmployeeId = payload.employeeId;
        let resolvedUserId = null;
        if (payload.level === "INDIVIDUAL" && payload.employeeId) {
            const emp = await db_1.default.employee.findFirst({
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
        const updateData = {
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
            const updatedKrIds = payload.keyResults.filter(k => k.id).map(k => k.id);
            const toDelete = currentKrIds.filter(id => !updatedKrIds.includes(id));
            if (toDelete.length > 0) {
                await db_1.default.keyResult.deleteMany({
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
        const updated = await db_1.default.objective.update({
            where: { id: objectiveId },
            data: updateData,
            include: { keyResults: true }
        });
        await this.recalculateObjectiveProgress(objectiveId);
        if (payload.level === "INDIVIDUAL" && resolvedUserId) {
            await notification_service_1.notificationService.createAndSendNotification({
                userId: resolvedUserId,
                title: "Yangi OKR Maqsadi",
                message: `Sizga yangi OKR maqsadi biriktirildi: ${updated.title}`,
                type: "GENERAL",
                metadata: { type: "OKR_ASSIGNED", objectiveId: updated.id },
            }).catch(() => { });
        }
        else if (payload.level === "DEPARTMENT" && payload.departmentId) {
            const deptEmployees = await db_1.default.employee.findMany({
                where: { departmentId: payload.departmentId },
                select: { userId: true },
            });
            for (const deptEmp of deptEmployees) {
                if (deptEmp.userId) {
                    await notification_service_1.notificationService.createAndSendNotification({
                        userId: deptEmp.userId,
                        title: "Bo'lim OKR Maqsadi",
                        message: `Bo'limingizga yangi OKR maqsadi biriktirildi: ${updated.title}`,
                        type: "GENERAL",
                        metadata: { type: "OKR_ASSIGNED", objectiveId: updated.id },
                    }).catch(() => { });
                }
            }
        }
        else if (payload.level === "COMPANY") {
            const allUsers = await db_1.default.user.findMany({
                where: {
                    role: { notIn: ["SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"] },
                    ...(existing.companyName ? { companyName: existing.companyName } : {}),
                },
                select: { id: true },
            });
            for (const u of allUsers) {
                await notification_service_1.notificationService.createAndSendNotification({
                    userId: u.id,
                    title: "Kompaniya OKR Maqsadi",
                    message: `Kompaniya bo'yicha yangi OKR maqsadi belgilandi: ${updated.title}`,
                    type: "GENERAL",
                    metadata: { type: "OKR_ASSIGNED", objectiveId: updated.id },
                }).catch(() => { });
            }
        }
        return updated;
    }
    async deleteObjective(objectiveId) {
        return db_1.default.objective.delete({
            where: { id: objectiveId },
        });
    }
    async checkInKeyResult(keyResultId, comment, imageUrl, userId, value) {
        const kr = await db_1.default.keyResult.findUnique({
            where: { id: keyResultId },
            include: { objective: { include: { employee: true } } },
        });
        if (!kr)
            throw new appError_1.AppError("Key Result not found", 404);
        const checkInValue = value !== undefined && value !== null && !isNaN(value) ? value : kr.targetValue;
        const checkIn = await db_1.default.okrCheckIn.create({
            data: {
                keyResultId,
                value: checkInValue,
                comment,
                imageUrl,
                status: "PENDING",
                createdById: userId || "SYSTEM",
            },
        });
        let empName = "Xodim";
        if (userId) {
            const submittingUser = await db_1.default.user.findUnique({
                where: { id: userId },
                include: { employee: true },
            });
            if (submittingUser?.employee) {
                empName = `${submittingUser.employee.firstName} ${submittingUser.employee.lastName}`.trim();
            }
        }
        else if (kr.objective.employee) {
            empName = `${kr.objective.employee.firstName} ${kr.objective.employee.lastName}`.trim();
        }
        let objCompany = kr.objective.companyName;
        if (!objCompany && userId) {
            const caller = await db_1.default.user.findUnique({
                where: { id: userId },
                select: { companyName: true },
            });
            if (caller?.companyName) {
                objCompany = caller.companyName;
            }
        }
        const hrAdminsAndDirectors = await db_1.default.user.findMany({
            where: {
                role: { in: ["HR_ADMIN", "DIRECTOR"] },
                ...(objCompany ? { companyName: objCompany } : {}),
            },
            select: { id: true },
        });
        for (const admin of hrAdminsAndDirectors) {
            await notification_service_1.notificationService.createAndSendNotification({
                userId: admin.id,
                title: "OKR Natijasi Topshirildi",
                message: `${empName} '${kr.title}' vazifasi bo'yicha OKR natijasini topshirdi. Iltimos, tekshiring.`,
                type: "GENERAL",
                metadata: {
                    type: "OKR_CHECKIN_SUBMITTED",
                    keyResultId,
                    checkInId: checkIn.id,
                },
            }).catch(() => { });
        }
        return db_1.default.keyResult.findUnique({
            where: { id: keyResultId },
            include: { checkIns: { orderBy: { createdAt: "desc" } } },
        });
    }
    async getPendingCheckIns(currentUser) {
        let companyFilter = null;
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }
        return db_1.default.okrCheckIn.findMany({
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
    async reviewCheckIn(checkInId, status, progress, reason) {
        const checkIn = await db_1.default.okrCheckIn.findUnique({
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
        if (!checkIn)
            throw new appError_1.AppError("Check-in not found", 404);
        if (checkIn.status !== "PENDING")
            throw new appError_1.AppError("Check-in is already reviewed", 400);
        const finalValue = progress !== undefined && progress !== null && !isNaN(progress)
            ? progress
            : (checkIn.value !== undefined && checkIn.value !== null ? Number(checkIn.value) : 100);
        await db_1.default.okrCheckIn.update({
            where: { id: checkInId },
            data: {
                status,
                value: finalValue,
                ...(reason ? { comment: reason } : {}),
            },
        });
        if (status === "APPROVED") {
            const kr = checkIn.keyResult;
            const progressValue = finalValue;
            const targetVal = kr.targetValue > 0 ? kr.targetValue : 1;
            const calculatedProgress = progressValue <= 100 ? progressValue : Math.min(100, Math.round((progressValue / targetVal) * 100));
            const calculatedCurrentValue = progressValue <= 100 ? Math.round((progressValue / 100) * targetVal) : progressValue;
            await db_1.default.keyResult.update({
                where: { id: kr.id },
                data: {
                    currentValue: calculatedCurrentValue,
                    progress: calculatedProgress,
                },
            });
            await this.recalculateObjectiveProgress(kr.objectiveId);
        }
        let targetUserId = checkIn.createdById !== "SYSTEM" ? checkIn.createdById : null;
        if (!targetUserId && checkIn.keyResult.objective.employee?.userId) {
            targetUserId = checkIn.keyResult.objective.employee.userId;
        }
        if (targetUserId) {
            await notification_service_1.notificationService.createAndSendNotification({
                userId: targetUserId,
                title: status === "APPROVED" ? "OKR Natijangiz Tasdiqlandi" : "OKR Natijangiz Qaytarildi",
                message: status === "APPROVED"
                    ? `'${checkIn.keyResult.title}' bo'yicha yuborgan OKR natijangiz tasdiqlandi.`
                    : `'${checkIn.keyResult.title}' bo'yicha yuborgan OKR natijangiz rad etildi.${reason ? ` Sabab: ${reason}` : ""}`,
                type: "GENERAL",
                metadata: {
                    type: "OKR_CHECKIN_REVIEWED",
                    checkInId,
                    status,
                    reason: reason || null,
                },
            }).catch(() => { });
        }
        return db_1.default.okrCheckIn.findUnique({
            where: { id: checkInId },
            include: { keyResult: true }
        });
    }
    async recalculateObjectiveProgress(objectiveId) {
        const objective = await db_1.default.objective.findUnique({
            where: { id: objectiveId },
            include: { keyResults: true },
        });
        if (!objective || objective.keyResults.length === 0)
            return;
        const totalProgress = objective.keyResults.reduce((acc, kr) => acc + kr.progress, 0);
        const avgProgress = totalProgress / objective.keyResults.length;
        await db_1.default.objective.update({
            where: { id: objectiveId },
            data: { progress: avgProgress },
        });
        if (objective.parentId) {
            await this.recalculateObjectiveProgress(objective.parentId);
        }
    }
    async updateObjectiveStatus(objectiveId, status) {
        return db_1.default.objective.update({
            where: { id: objectiveId },
            data: { status },
        });
    }
    async getDashboard(cycleId, departmentId, currentUser) {
        let companyFilter = null;
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }
        let activeCycleId = cycleId;
        if (!activeCycleId) {
            const currentCycle = await db_1.default.okrCycle.findFirst({
                where: {
                    isCurrent: true,
                    ...(companyFilter ? { companyName: companyFilter } : {}),
                },
            });
            activeCycleId = currentCycle?.id;
        }
        const where = {};
        if (activeCycleId)
            where.cycleId = activeCycleId;
        if (departmentId)
            where.departmentId = departmentId;
        if (companyFilter)
            where.companyName = companyFilter;
        const objectives = await db_1.default.objective.findMany({
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
        const companyObjectives = objectives.filter((o) => o.level === "COMPANY");
        const departmentObjectives = objectives.filter((o) => o.level === "DEPARTMENT");
        const individualObjectives = objectives.filter((o) => o.level === "INDIVIDUAL");
        const calcAvg = (arr) => arr.length > 0
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
exports.OkrService = OkrService;
exports.okrService = new OkrService();

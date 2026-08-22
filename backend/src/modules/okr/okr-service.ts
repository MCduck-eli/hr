import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class OkrService {
    async createCycle(payload: {
        title: string;
        startDate: string;
        endDate: string;
        isCurrent?: boolean;
        minExpectedProgress?: number;
    }) {
        if (payload.isCurrent) {
            await prisma.okrCycle.updateMany({
                where: { isCurrent: true },
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
            },
        });
    }

    async getCycles() {
        return prisma.okrCycle.findMany({
            orderBy: { startDate: "desc" },
        });
    }

    async createObjective(payload: {
        cycleId: string;
        level: "COMPANY" | "DEPARTMENT" | "INDIVIDUAL";
        title: string;
        description?: string;
        departmentId?: string;
        employeeId?: string;
        parentId?: string;
        minExpectedProgress?: number;
        keyResults: {
            title: string;
            initialValue?: number;
            targetValue: number;
            unit?: string;
        }[];
    }) {
        return prisma.objective.create({
            data: {
                cycleId: payload.cycleId,
                level: payload.level,
                title: payload.title,
                description: payload.description,
                departmentId: payload.departmentId,
                employeeId: payload.employeeId,
                parentId: payload.parentId,
                minExpectedProgress: payload.minExpectedProgress,
                keyResults: {
                    create: payload.keyResults.map((kr) => ({
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

        const updateData: any = {};
        if (payload.level !== undefined) updateData.level = payload.level;
        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.description !== undefined) updateData.description = payload.description;
        if (payload.departmentId !== undefined) updateData.departmentId = payload.departmentId;
        if (payload.employeeId !== undefined) updateData.employeeId = payload.employeeId;
        if (payload.parentId !== undefined) updateData.parentId = payload.parentId;
        if (payload.minExpectedProgress !== undefined) updateData.minExpectedProgress = payload.minExpectedProgress;

        if (payload.keyResults) {
            const existingKrIds = objective.keyResults.map(kr => kr.id);
            const payloadKrIds = payload.keyResults.map(kr => kr.id).filter(id => id);
            
            const krsToDelete = existingKrIds.filter(id => !payloadKrIds.includes(id));
            
            updateData.keyResults = {
                deleteMany: krsToDelete.length > 0 ? { id: { in: krsToDelete } } : undefined,
                upsert: payload.keyResults.map(kr => ({
                    where: { id: kr.id || "new-kr" },
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
                        // Not updating initialValue or currentValue to prevent messing up progress during normal edit
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
            include: { objective: true },
        });

        if (!kr) throw new AppError("Key Result not found", 404);

        const value = kr.targetValue; // Storing target value in the check-in record for reference

        await prisma.okrCheckIn.create({
            data: {
                keyResultId,
                value,
                comment,
                imageUrl,
                status: "PENDING",
                createdById: userId || "SYSTEM",
            },
        });

        // We don't update KeyResult or Objective yet. 
        // Wait for HR Admin to review it.

        return prisma.keyResult.findUnique({
            where: { id: keyResultId },
            include: { checkIns: { orderBy: { createdAt: "desc" } } },
        });
    }

    async getPendingCheckIns() {
        return prisma.okrCheckIn.findMany({
            where: { status: "PENDING" },
            include: {
                keyResult: {
                    include: {
                        objective: {
                            include: {
                                employee: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    }

    async reviewCheckIn(checkInId: string, status: "APPROVED" | "REJECTED") {
        const checkIn = await prisma.okrCheckIn.findUnique({
            where: { id: checkInId },
            include: { keyResult: true }
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

    async getDashboard(cycleId?: string, departmentId?: string) {
        let activeCycleId = cycleId;

        if (!activeCycleId) {
            const currentCycle = await prisma.okrCycle.findFirst({
                where: { isCurrent: true },
            });
            activeCycleId = currentCycle?.id;
        }

        const where: any = {};
        if (activeCycleId) where.cycleId = activeCycleId;
        if (departmentId) where.departmentId = departmentId;

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

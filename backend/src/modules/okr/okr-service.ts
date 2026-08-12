import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class OkrService {
    async createCycle(payload: {
        title: string;
        startDate: string;
        endDate: string;
        isCurrent?: boolean;
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

    async checkInKeyResult(
        keyResultId: string,
        value: number,
        comment?: string,
        userId?: string,
    ) {
        const kr = await prisma.keyResult.findUnique({
            where: { id: keyResultId },
            include: { objective: true },
        });

        if (!kr) throw new AppError("Key Result not found", 404);

        const range = kr.targetValue - kr.initialValue;
        let krProgress = 0;
        if (range !== 0) {
            krProgress = Math.min(
                100,
                Math.max(0, ((value - kr.initialValue) / range) * 100),
            );
        }

        await prisma.keyResult.update({
            where: { id: keyResultId },
            data: {
                currentValue: value,
                progress: krProgress,
            },
        });

        await prisma.okrCheckIn.create({
            data: {
                keyResultId,
                value,
                comment,
                createdById: userId || "SYSTEM",
            },
        });

        await this.recalculateObjectiveProgress(kr.objectiveId);

        return prisma.keyResult.findUnique({
            where: { id: keyResultId },
            include: { checkIns: { orderBy: { createdAt: "desc" } } },
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

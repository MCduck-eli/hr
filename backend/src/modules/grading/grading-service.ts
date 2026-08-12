import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class GradingService {
    async createGrade(payload: {
        code: string;
        title: string;
        level: number;
        minSalary: number;
        maxSalary: number;
        requirements?: string;
        responsibilities?: string;
    }) {
        const existing = await prisma.jobGrade.findUnique({
            where: { code: payload.code },
        });
        if (existing)
            throw new AppError("Grade with this code already exists", 400);

        return prisma.jobGrade.create({
            data: payload,
        });
    }

    async getGrades() {
        return prisma.jobGrade.findMany({
            orderBy: { level: "asc" },
            include: { _count: { select: { employees: true } } },
        });
    }

    async assignGradeToEmployee(employeeId: string, gradeId: string) {
        const grade = await prisma.jobGrade.findUnique({
            where: { id: gradeId },
        });
        if (!grade) throw new AppError("Job Grade not found", 404);

        return prisma.employee.update({
            where: { id: employeeId },
            data: { gradeId },
            include: { grade: true },
        });
    }

    async createPromotionRequest(payload: {
        employeeId: string;
        targetGradeId: string;
        proposedSalary: number;
        reason: string;
    }) {
        const employee = await prisma.employee.findUnique({
            where: { id: payload.employeeId },
            include: { grade: true },
        });

        if (!employee) throw new AppError("Employee not found", 404);

        const targetGrade = await prisma.jobGrade.findUnique({
            where: { id: payload.targetGradeId },
        });
        if (!targetGrade) throw new AppError("Target grade not found", 404);

        if (
            payload.proposedSalary < targetGrade.minSalary ||
            payload.proposedSalary > targetGrade.maxSalary
        ) {
            throw new AppError(
                `Proposed salary must be within target grade range (${targetGrade.minSalary} - ${targetGrade.maxSalary})`,
                400,
            );
        }
        const objectives = await prisma.objective.findMany({
            where: { employeeId: payload.employeeId },
        });
        const okrScore =
            objectives.length > 0
                ? Number(
                      (
                          objectives.reduce((acc, o) => acc + o.progress, 0) /
                          objectives.length
                      ).toFixed(2),
                  )
                : null;
        const assignments = await prisma.feedbackAssignment.findMany({
            where: { targetId: payload.employeeId, isCompleted: true },
            include: { answers: true },
        });

        let totalFeedbackScore = 0;
        let totalAnswers = 0;

        assignments.forEach((asg) => {
            asg.answers.forEach((ans) => {
                totalFeedbackScore += ans.score;
                totalAnswers += 1;
            });
        });

        const feedback360Score =
            totalAnswers > 0
                ? Number((totalFeedbackScore / totalAnswers).toFixed(2))
                : null;

        return prisma.promotionRequest.create({
            data: {
                employeeId: payload.employeeId,
                currentGradeId: employee.gradeId,
                targetGradeId: payload.targetGradeId,
                proposedSalary: payload.proposedSalary,
                reason: payload.reason,
                okrScore,
                feedback360Score,
            },
            include: {
                employee: { select: { firstName: true, lastName: true } },
                targetGrade: true,
            },
        });
    }

    async processPromotionApproval(
        requestId: string,
        approverRole: "DEPARTMENT_HEAD" | "HR_ADMIN" | "SUPER_ADMIN",
        action: "APPROVE" | "REJECT",
    ) {
        const request = await prisma.promotionRequest.findUnique({
            where: { id: requestId },
            include: { employee: true, targetGrade: true, currentGrade: true },
        });

        if (!request) throw new AppError("Promotion request not found", 404);
        if (
            request.status === "REJECTED" ||
            request.status === "APPROVED_BY_HR"
        ) {
            throw new AppError("Request is already finalized", 400);
        }

        if (action === "REJECT") {
            return prisma.promotionRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED" },
            });
        }

        let updatedStatus: any = request.status;
        let managerApproval = request.managerApproval;
        let hrApproval = request.hrApproval;

        if (approverRole === "DEPARTMENT_HEAD") {
            managerApproval = true;
            updatedStatus = "APPROVED_BY_MANAGER";
        }

        if (approverRole === "HR_ADMIN" || approverRole === "SUPER_ADMIN") {
            hrApproval = true;
            updatedStatus = "APPROVED_BY_HR";
        }

        const updatedRequest = await prisma.promotionRequest.update({
            where: { id: requestId },
            data: {
                status: updatedStatus,
                managerApproval,
                hrApproval,
            },
        });
        if (hrApproval) {
            await prisma.employee.update({
                where: { id: request.employeeId },
                data: {
                    gradeId: request.targetGradeId,
                },
            });

            await prisma.careerHistory.create({
                data: {
                    employeeId: request.employeeId,
                    oldGradeTitle: request.currentGrade?.title || "Noma'lum",
                    newGradeTitle: request.targetGrade.title,
                    newSalary: request.proposedSalary,
                    reason: `Promotion: ${request.reason}`,
                },
            });
        }

        return updatedRequest;
    }

    async getCareerHistory(employeeId: string) {
        return prisma.careerHistory.findMany({
            where: { employeeId },
            orderBy: { changedAt: "desc" },
        });
    }
}

export const gradingService = new GradingService();

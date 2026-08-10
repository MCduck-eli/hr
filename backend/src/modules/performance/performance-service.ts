import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class PerformanceService {
    async createReview(
        reviewerUserId: string,
        payload: {
            employeeId: string;
            score: number;
            feedback: string;
            period: string;
        },
    ) {
        const employee = await prisma.employee.findUnique({
            where: { id: payload.employeeId },
        });

        if (!employee) {
            throw new AppError("Employee not found", 404);
        }

        return prisma.performanceReview.create({
            data: {
                employeeId: payload.employeeId,
                reviewerId: reviewerUserId,
                score: payload.score,
                feedback: payload.feedback,
                period: payload.period,
            },
        });
    }

    async getMyReviews(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        return prisma.performanceReview.findMany({
            where: { employeeId: employee.id },
            orderBy: { createdAt: "desc" },
        });
    }

    async getEmployeeReviews(employeeId: string) {
        return prisma.performanceReview.findMany({
            where: { employeeId },
            orderBy: { createdAt: "desc" },
        });
    }
}

export const performanceService = new PerformanceService();

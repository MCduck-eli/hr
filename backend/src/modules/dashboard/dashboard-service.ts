import { PrismaClient } from "@prisma/client";
import { AppError } from "../../utils/appError";

const prisma = new PrismaClient();

export class DashboardService {
    async getEmployeeDashboardData(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
            include: {
                courseProgresses: {
                    where: { isCompleted: false },
                    include: { course: true },
                },
                lifecycleEvents: {
                    orderBy: { createdAt: "desc" },
                    take: 3,
                },
            },
        });

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        const pendingFeedbacks = await prisma.feedbackAssignment.count({
            where: {
                reviewerId: employee.id,
                isCompleted: false,
            },
        });

        return {
            okrProgress: 75,
            attendanceHours: 38,
            pendingFeedbacks,
            leaveBalance: employee.leaveBalance,
            activeCourses: employee.courseProgresses.map((cp) => ({
                title: cp.course.title,
                progress: cp.quizScore || 0,
            })),
            recentActivities: employee.lifecycleEvents.map((event) => ({
                title: event.title,
                description: event.description,
                timeAgo: "Yaqinda",
            })),
        };
    }
}

export const dashboardService = new DashboardService();

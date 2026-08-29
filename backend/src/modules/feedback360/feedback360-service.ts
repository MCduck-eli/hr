import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { notificationService } from "../notification/notification-service";

export class Feedback360Service {
    async createCycle(payload: {
        title: string;
        description?: string;
        startDate: string;
        endDate: string;
        questions: { competency: string; text: string; order?: number }[];
    }) {
        return prisma.feedbackCycle.create({
            data: {
                title: payload.title,
                description: payload.description,
                startDate: new Date(payload.startDate),
                endDate: new Date(payload.endDate),
                status: "ACTIVE",
                questions: {
                    create: payload.questions,
                },
            },
            include: { questions: true },
        });
    }

    async getCycles() {
        return prisma.feedbackCycle.findMany({
            orderBy: { createdAt: "desc" },
            include: { 
                questions: true,
                _count: { select: { assignments: true, questions: true } }
            },
        });
    }

    async updateCycle(cycleId: string, data: any) {
        const cycle = await prisma.feedbackCycle.findUnique({ where: { id: cycleId } });
        if (!cycle) throw new AppError("Cycle not found", 404);

        const { questions, ...cycleData } = data;

        await prisma.feedbackQuestion.deleteMany({
            where: { cycleId },
        });

        const updatedCycle = await prisma.feedbackCycle.update({
            where: { id: cycleId },
            data: {
                ...cycleData,
                questions: {
                    create: questions,
                },
            },
            include: { questions: true },
        });
        return updatedCycle;
    }

    async deleteCycle(cycleId: string) {
        const cycle = await prisma.feedbackCycle.findUnique({ where: { id: cycleId } });
        if (!cycle) throw new AppError("Cycle not found", 404);

        await prisma.feedbackCycle.delete({
            where: { id: cycleId },
        });
        return { message: "Cycle deleted successfully" };
    }

    async getAssignments(cycleId: string, targetId?: string) {
        return prisma.feedbackAssignment.findMany({
            where: {
                cycleId,
                ...(targetId ? { targetId } : {}),
            },
            include: {
                answers: true,
                reviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                    },
                },
                target: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                    },
                },
            },
        });
    }

    async assignReviewers(
        cycleId: string,
        targetId: string,
        reviewers: {
            reviewerId: string;
            type: "SELF" | "MANAGER" | "PEER" | "SUBORDINATE";
        }[],
    ) {
        const reviewerIds = reviewers.map((r) => r.reviewerId);

        await prisma.feedbackAssignment.deleteMany({
            where: {
                cycleId,
                targetId,
                ...(reviewerIds.length > 0 ? { reviewerId: { notIn: reviewerIds } } : {}),
            },
        });

        const assignments = reviewers.map((r) =>
            prisma.feedbackAssignment.upsert({
                where: {
                    cycleId_targetId_reviewerId: {
                        cycleId,
                        targetId,
                        reviewerId: r.reviewerId,
                    },
                },
                update: { type: r.type },
                create: {
                    cycleId,
                    targetId,
                    reviewerId: r.reviewerId,
                    type: r.type,
                },
            }),
        );

        const createdAssignments = await Promise.all(assignments);

        const targetEmployee = await prisma.employee.findUnique({
            where: { id: targetId },
            select: { firstName: true, lastName: true },
        });
        const targetName = targetEmployee
            ? `${targetEmployee.firstName} ${targetEmployee.lastName}`.trim()
            : "hamkasbingiz";

        for (const r of reviewers) {
            const reviewerEmp = await prisma.employee.findUnique({
                where: { id: r.reviewerId },
                select: { userId: true },
            });
            if (reviewerEmp?.userId) {
                await notificationService.createAndSendNotification({
                    userId: reviewerEmp.userId,
                    title: "360 Baholash So'rovi",
                    message: `Sizga 360 baholash so'rovi biriktirildi. Iltimos, ${targetName}ni baholang.`,
                    type: "GENERAL",
                    metadata: {
                        type: "FEEDBACK_360_REQUEST",
                        cycleId,
                        targetId,
                    },
                }).catch(() => {});
            }
        }

        return createdAssignments;
    }

    async getMyPendingTasks(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });
        if (!employee) return [];

        return prisma.feedbackAssignment.findMany({
            where: {
                reviewerId: employee.id,
                isCompleted: false,
                cycle: { status: "ACTIVE" },
            },
            include: {
                cycle: {
                    include: { questions: { orderBy: { order: "asc" } } },
                },
                target: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                    },
                },
            },
        });
    }

    async getAssignmentById(assignmentId: string, userId: string, role: string) {
        const assignment = await prisma.feedbackAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                cycle: {
                    include: { questions: { orderBy: { order: "asc" } } },
                },
                target: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                    },
                },
            },
        });
        
        if (!assignment) throw new AppError("Assignment not found", 404);
        
        return assignment;
    }

    async deleteAssignment(assignmentId: string) {
        const assignment = await prisma.feedbackAssignment.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment) throw new AppError("Assignment not found", 404);

        await prisma.feedbackAssignment.delete({
            where: { id: assignmentId },
        });
        return { message: "Assignment deleted successfully" };
    }

    async submitFeedback(
        assignmentId: string,
        reviewerUserId: string,
        userRole: string,
        answers: { questionId: string; score: number; comment?: string }[],
    ) {
        const reviewer = await prisma.employee.findUnique({
            where: { userId: reviewerUserId },
        });
        if (!reviewer) throw new AppError("Reviewer profile not found", 404);

        const assignment = await prisma.feedbackAssignment.findUnique({
            where: { id: assignmentId },
        });

        if (!assignment) throw new AppError("Assignment not found", 404);
        
        if (userRole !== "SUPER_ADMIN" && assignment.reviewerId !== reviewer.id) {
            throw new AppError("Unauthorized to complete this feedback", 403);
        }

        const answerCreates = answers.map((a) =>
            prisma.feedbackAnswer.upsert({
                where: {
                    assignmentId_questionId: {
                        assignmentId,
                        questionId: a.questionId,
                    },
                },
                update: {
                    score: a.score,
                    comment: a.comment,
                },
                create: {
                    assignmentId,
                    questionId: a.questionId,
                    score: a.score,
                    comment: a.comment,
                },
            }),
        );

        await Promise.all(answerCreates);

        const updatedAssignment = await prisma.feedbackAssignment.update({
            where: { id: assignmentId },
            data: { isCompleted: true },
        });

        const targetEmployee = await prisma.employee.findUnique({
            where: { id: assignment.targetId },
            select: { userId: true, firstName: true, lastName: true },
        });

        if (targetEmployee?.userId) {
            await notificationService.createAndSendNotification({
                userId: targetEmployee.userId,
                title: "360 Baholash Yakunlandi",
                message: "Siz 360 baholash doirasida baholandingiz.",
                type: "GENERAL",
                metadata: {
                    type: "FEEDBACK_360_COMPLETED",
                    cycleId: assignment.cycleId,
                    targetId: assignment.targetId,
                    assignmentId,
                },
            }).catch(() => {});
        }

        return updatedAssignment;
    }

    async getTargetReport(
        targetEmployeeId: string, 
        cycleId: string,
        requestUserId: string,
        role: string
    ) {
        const target = await prisma.employee.findUnique({
            where: { id: targetEmployeeId },
            include: { department: true, position: true },
        });

        if (!target) throw new AppError("Target employee not found", 404);

        if (role === "EMPLOYEE" && target.userId !== requestUserId) {
            throw new AppError("Unauthorized to view other employee's report", 403);
        }

        const assignments = await prisma.feedbackAssignment.findMany({
            where: {
                targetId: targetEmployeeId,
                cycleId,
                isCompleted: true,
            },
            include: {
                answers: {
                    include: { question: true },
                },
            },
        });

        const competencyScores: Record<
            string,
            {
                total: number;
                count: number;
                byType: Record<string, { total: number; count: number }>;
            }
        > = {};

        const comments: string[] = [];

        assignments.forEach((asg) => {
            const type = asg.type;
            asg.answers.forEach((ans) => {
                const comp = ans.question.competency;

                if (!competencyScores[comp]) {
                    competencyScores[comp] = {
                        total: 0,
                        count: 0,
                        byType: {},
                    };
                }

                competencyScores[comp].total += ans.score;
                competencyScores[comp].count += 1;

                if (!competencyScores[comp].byType[type]) {
                    competencyScores[comp].byType[type] = {
                        total: 0,
                        count: 0,
                    };
                }

                competencyScores[comp].byType[type].total += ans.score;
                competencyScores[comp].byType[type].count += 1;

                if (ans.comment && type !== "SELF") {
                    comments.push(ans.comment);
                }
            });
        });

        const reportData: any[] = [];
        Object.keys(competencyScores).forEach((comp) => {
            const item = competencyScores[comp];
            const avgOverall = Number((item.total / item.count).toFixed(2));

            const breakdown: Record<string, number> = {};
            Object.keys(item.byType).forEach((t) => {
                breakdown[t] = Number(
                    (item.byType[t].total / item.byType[t].count).toFixed(2),
                );
            });

            reportData.push({
                competency: comp,
                averageScore: avgOverall,
                breakdown,
            });
        });

        const allAnswers = assignments.flatMap(a => a.answers);
        const lastEvaluatedAt = allAnswers.length > 0
            ? new Date(Math.max(...allAnswers.map(ans => ans.createdAt.getTime()))).toISOString()
            : null;

        return {
            employee: {
                id: target.id,
                firstName: target.firstName,
                lastName: target.lastName,
                department: target.department?.name,
                position: target.position?.title,
            },
            competencies: reportData,
            totalRespondents: assignments.length,
            lastEvaluatedAt,
            anonymousComments: comments,
        };
    }
}

export const feedback360Service = new Feedback360Service();

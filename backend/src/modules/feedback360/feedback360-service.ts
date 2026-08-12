import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

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
            include: {
                _count: { select: { assignments: true, questions: true } },
            },
            orderBy: { createdAt: "desc" },
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

        return Promise.all(assignments);
    }

    async getMyPendingTasks(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });
        if (!employee) throw new AppError("Employee profile not found", 404);

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
                        position: { select: { title: true } },
                    },
                },
            },
        });
    }

    async submitFeedback(
        assignmentId: string,
        reviewerUserId: string,
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
        if (assignment.reviewerId !== reviewer.id) {
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

        return prisma.feedbackAssignment.update({
            where: { id: assignmentId },
            data: { isCompleted: true },
        });
    }

    async getTargetReport(targetEmployeeId: string, cycleId: string) {
        const target = await prisma.employee.findUnique({
            where: { id: targetEmployeeId },
            include: { department: true, position: true },
        });

        if (!target) throw new AppError("Target employee not found", 404);

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

        return {
            employee: {
                id: target.id,
                fullName: `${target.firstName} ${target.lastName}`,
                department: target.department?.name,
                position: target.position?.title,
            },
            totalRespondents: assignments.length,
            competencies: reportData,
            anonymousComments: comments,
        };
    }
}

export const feedback360Service = new Feedback360Service();

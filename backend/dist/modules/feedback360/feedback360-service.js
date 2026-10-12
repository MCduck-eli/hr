"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedback360Service = exports.Feedback360Service = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
const notification_service_1 = require("../notification/notification-service");
class Feedback360Service {
    async resolveCallerCompany(currentUser) {
        if (!currentUser?.id)
            return null;
        if (currentUser.role === "SUPER_ADMIN" && !currentUser.companyName)
            return null;
        if (currentUser.companyName)
            return currentUser.companyName;
        const caller = await db_1.default.user.findUnique({
            where: { id: currentUser.id },
            select: { role: true, companyName: true },
        });
        if (caller && caller.role !== "SUPER_ADMIN") {
            return caller.companyName || null;
        }
        return currentUser.companyName || null;
    }
    async createCycle(payload, currentUser) {
        const companyName = await this.resolveCallerCompany(currentUser);
        return db_1.default.feedbackCycle.create({
            data: {
                title: payload.title,
                description: payload.description,
                startDate: new Date(payload.startDate),
                endDate: new Date(payload.endDate),
                status: "ACTIVE",
                companyName,
                questions: {
                    create: payload.questions,
                },
            },
            include: { questions: true },
        });
    }
    async getCycles(currentUser) {
        const companyFilter = await this.resolveCallerCompany(currentUser);
        return db_1.default.feedbackCycle.findMany({
            where: companyFilter ? { companyName: companyFilter } : {},
            orderBy: { createdAt: "desc" },
            include: {
                questions: true,
                _count: { select: { assignments: true, questions: true } }
            },
        });
    }
    async updateCycle(cycleId, data, currentUser) {
        const companyFilter = await this.resolveCallerCompany(currentUser);
        const cycle = await db_1.default.feedbackCycle.findFirst({
            where: {
                id: cycleId,
                ...(companyFilter ? { companyName: companyFilter } : {}),
            },
        });
        if (!cycle)
            throw new appError_1.AppError("Cycle not found", 404);
        const { questions, ...cycleData } = data;
        await db_1.default.feedbackQuestion.deleteMany({
            where: { cycleId },
        });
        const updatedCycle = await db_1.default.feedbackCycle.update({
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
    async deleteCycle(cycleId, currentUser) {
        const companyFilter = await this.resolveCallerCompany(currentUser);
        const cycle = await db_1.default.feedbackCycle.findFirst({
            where: {
                id: cycleId,
                ...(companyFilter ? { companyName: companyFilter } : {}),
            },
        });
        if (!cycle)
            throw new appError_1.AppError("Cycle not found", 404);
        await db_1.default.feedbackCycle.delete({
            where: { id: cycleId },
        });
        return { message: "Cycle deleted successfully" };
    }
    async getAssignments(cycleId, targetId, currentUser) {
        const companyFilter = await this.resolveCallerCompany(currentUser);
        return db_1.default.feedbackAssignment.findMany({
            where: {
                cycleId,
                ...(companyFilter ? { cycle: { companyName: companyFilter } } : {}),
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
    async assignReviewers(cycleId, targetId, reviewers, currentUser) {
        const companyFilter = await this.resolveCallerCompany(currentUser);
        const cycle = await db_1.default.feedbackCycle.findFirst({
            where: {
                id: cycleId,
                ...(companyFilter ? { companyName: companyFilter } : {}),
            },
        });
        if (!cycle)
            throw new appError_1.AppError("Cycle not found", 404);
        const reviewerIds = reviewers.map((r) => r.reviewerId);
        await db_1.default.feedbackAssignment.deleteMany({
            where: {
                cycleId,
                targetId,
                ...(reviewerIds.length > 0 ? { reviewerId: { notIn: reviewerIds } } : {}),
            },
        });
        const assignments = reviewers.map((r) => db_1.default.feedbackAssignment.upsert({
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
        }));
        const createdAssignments = await Promise.all(assignments);
        const targetEmployee = await db_1.default.employee.findUnique({
            where: { id: targetId },
            select: { firstName: true, lastName: true },
        });
        for (const r of reviewers) {
            const reviewerEmp = await db_1.default.employee.findUnique({
                where: { id: r.reviewerId },
                select: { userId: true },
            });
            if (reviewerEmp?.userId) {
                await notification_service_1.notificationService.createAndSendNotification({
                    userId: reviewerEmp.userId,
                    title: "360 Baholash So'rovi",
                    message: `${targetEmployee ? `${targetEmployee.firstName} ${targetEmployee.lastName}` : "Hamkasbingiz"} uchun 360 baholash so'rovnomasi yuborildi.`,
                    type: "GENERAL",
                    metadata: {
                        type: "FEEDBACK_360_ASSIGNED",
                        cycleId,
                        targetId,
                    },
                }).catch(() => { });
            }
        }
        return createdAssignments;
    }
    async getMyPendingTasks(userId) {
        const employee = await db_1.default.employee.findUnique({
            where: { userId },
        });
        if (!employee)
            return [];
        return db_1.default.feedbackAssignment.findMany({
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
    async getAssignmentById(assignmentId, userId, role) {
        const assignment = await db_1.default.feedbackAssignment.findUnique({
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
        if (!assignment)
            throw new appError_1.AppError("Assignment not found", 404);
        return assignment;
    }
    async deleteAssignment(assignmentId) {
        const assignment = await db_1.default.feedbackAssignment.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment)
            throw new appError_1.AppError("Assignment not found", 404);
        await db_1.default.feedbackAssignment.delete({
            where: { id: assignmentId },
        });
        return { message: "Assignment deleted successfully" };
    }
    async submitFeedback(assignmentId, reviewerUserId, userRole, answers) {
        const reviewer = await db_1.default.employee.findUnique({
            where: { userId: reviewerUserId },
        });
        if (!reviewer)
            throw new appError_1.AppError("Reviewer profile not found", 404);
        const assignment = await db_1.default.feedbackAssignment.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment)
            throw new appError_1.AppError("Assignment not found", 404);
        if (userRole !== "SUPER_ADMIN" && assignment.reviewerId !== reviewer.id) {
            throw new appError_1.AppError("Unauthorized to complete this feedback", 403);
        }
        const answerCreates = answers.map((a) => db_1.default.feedbackAnswer.upsert({
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
        }));
        await Promise.all(answerCreates);
        const updatedAssignment = await db_1.default.feedbackAssignment.update({
            where: { id: assignmentId },
            data: { isCompleted: true },
        });
        const targetEmployee = await db_1.default.employee.findUnique({
            where: { id: assignment.targetId },
            select: { userId: true, firstName: true, lastName: true },
        });
        if (targetEmployee?.userId) {
            await notification_service_1.notificationService.createAndSendNotification({
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
            }).catch(() => { });
        }
        return updatedAssignment;
    }
    async getTargetReport(targetEmployeeId, cycleId, requestUserId, role) {
        const target = await db_1.default.employee.findUnique({
            where: { id: targetEmployeeId },
            include: { department: true, position: true },
        });
        if (!target)
            throw new appError_1.AppError("Target employee not found", 404);
        if (role === "EMPLOYEE" && requestUserId && target.userId !== requestUserId) {
            throw new appError_1.AppError("Unauthorized to view other employee's report", 403);
        }
        const whereClause = {
            targetId: targetEmployeeId,
            isCompleted: true,
        };
        if (cycleId) {
            whereClause.cycleId = cycleId;
        }
        const assignments = await db_1.default.feedbackAssignment.findMany({
            where: whereClause,
            include: {
                answers: {
                    include: { question: true },
                },
            },
        });
        const competencyScores = {};
        const comments = [];
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
        const reportData = [];
        Object.keys(competencyScores).forEach((comp) => {
            const item = competencyScores[comp];
            const avgOverall = Number((item.total / item.count).toFixed(2));
            const breakdown = {};
            Object.keys(item.byType).forEach((t) => {
                breakdown[t] = Number((item.byType[t].total / item.byType[t].count).toFixed(2));
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
exports.Feedback360Service = Feedback360Service;
exports.feedback360Service = new Feedback360Service();

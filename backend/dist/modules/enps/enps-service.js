"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enpsService = exports.EnpsService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const error_middleware_1 = require("../../middlewares/error-middleware");
class EnpsService {
    async getQuestions(companyName, activeOnly = false) {
        let questions = await db_1.default.enpsQuestion.findMany({
            where: {
                ...(companyName ? { companyName } : {}),
                ...(activeOnly ? { isActive: true } : {}),
            },
            orderBy: { createdAt: "asc" },
        });
        if (questions.length === 0) {
            const defaultQ = await db_1.default.enpsQuestion.create({
                data: {
                    companyName: companyName || null,
                    question: "Kompaniyamizda ishlash tajribangizni do'stlaringiz yoki tanishlaringizga ish joyi sifatida tavsiya qilasizmi?",
                    description: "0 — Umuman tavsiya qilmayman, 10 — Albatta tavsiya qilaman",
                    minScale: 0,
                    maxScale: 10,
                    minLabel: "Tavsiya qilmayman",
                    maxLabel: "Albatta tavsiya qilaman",
                    isActive: true,
                },
            });
            questions = [defaultQ];
        }
        return questions;
    }
    async createQuestion(companyName, data) {
        if (!data.question || !data.question.trim()) {
            throw new error_middleware_1.AppError("Savol matni kiritilishi shart", 400);
        }
        const created = await db_1.default.enpsQuestion.create({
            data: {
                companyName: companyName || null,
                question: data.question.trim(),
                description: data.description?.trim() || null,
                minScale: data.minScale ?? 0,
                maxScale: data.maxScale ?? 10,
                minLabel: data.minLabel?.trim() || "Tavsiya qilmayman",
                maxLabel: data.maxLabel?.trim() || "Albatta tavsiya qilaman",
                isActive: data.isActive !== undefined ? data.isActive : true,
            },
        });
        return created;
    }
    async updateQuestion(id, companyName, data) {
        const existing = await db_1.default.enpsQuestion.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new error_middleware_1.AppError("Savol topilmadi", 404);
        }
        if (companyName && existing.companyName && existing.companyName !== companyName) {
            throw new error_middleware_1.AppError("Ruxsat berilmagan", 403);
        }
        const updated = await db_1.default.enpsQuestion.update({
            where: { id },
            data: {
                ...(data.question !== undefined ? { question: data.question.trim() } : {}),
                ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
                ...(data.minScale !== undefined ? { minScale: data.minScale } : {}),
                ...(data.maxScale !== undefined ? { maxScale: data.maxScale } : {}),
                ...(data.minLabel !== undefined ? { minLabel: data.minLabel?.trim() || "Tavsiya qilmayman" } : {}),
                ...(data.maxLabel !== undefined ? { maxLabel: data.maxLabel?.trim() || "Albatta tavsiya qilaman" } : {}),
                ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
            },
        });
        return updated;
    }
    async deleteQuestion(id, companyName) {
        const existing = await db_1.default.enpsQuestion.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new error_middleware_1.AppError("Savol topilmadi", 404);
        }
        if (companyName && existing.companyName && existing.companyName !== companyName) {
            throw new error_middleware_1.AppError("Ruxsat berilmagan", 403);
        }
        await db_1.default.enpsQuestion.delete({
            where: { id },
        });
        return { success: true, message: "Savol muvaffaqiyatli o'chirildi" };
    }
    async submitEnps(userId, payload) {
        const employee = await db_1.default.employee.findUnique({
            where: { userId },
            include: { user: true },
        });
        if (!employee) {
            throw new error_middleware_1.AppError("Employee not found", 404);
        }
        const score = Math.min(10, Math.max(0, Number(payload.score)));
        const companyName = employee.user?.companyName || null;
        let questionId = payload.questionId || null;
        if (!questionId) {
            const activeQuestions = await this.getQuestions(companyName, true);
            if (activeQuestions.length > 0) {
                questionId = activeQuestions[0].id;
            }
        }
        const existing = await db_1.default.enpsResponse.findFirst({
            where: {
                employeeId: employee.id,
                OR: [
                    ...(questionId ? [{ questionId }] : []),
                    { questionId: null },
                ],
            },
            orderBy: { createdAt: "desc" },
        });
        let response;
        if (existing) {
            response = await db_1.default.enpsResponse.update({
                where: { id: existing.id },
                data: {
                    score,
                    comment: payload.comment?.trim() || null,
                    companyName,
                    questionId,
                },
            });
        }
        else {
            response = await db_1.default.enpsResponse.create({
                data: {
                    employeeId: employee.id,
                    companyName,
                    questionId,
                    score,
                    comment: payload.comment?.trim() || null,
                },
            });
        }
        return {
            id: response.id,
            score: response.score,
            comment: response.comment,
            questionId: response.questionId,
            submittedAt: response.createdAt,
        };
    }
    async getMyLatestEnps(userId, questionId) {
        const employee = await db_1.default.employee.findUnique({
            where: { userId },
        });
        if (!employee)
            return null;
        const latest = await db_1.default.enpsResponse.findFirst({
            where: {
                employeeId: employee.id,
                OR: [
                    ...(questionId ? [{ questionId }] : []),
                    { questionId: null },
                ],
            },
            orderBy: { createdAt: "desc" },
        });
        if (!latest)
            return null;
        return {
            id: latest.id,
            score: latest.score,
            comment: latest.comment,
            questionId: latest.questionId,
            submittedAt: latest.createdAt,
        };
    }
    async getEnpsAnalytics(companyName) {
        const rawResponses = await db_1.default.enpsResponse.findMany({
            where: {
                ...(companyName ? { companyName } : {}),
            },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                    },
                },
                question: true,
            },
            orderBy: { createdAt: "desc" },
        });
        const latestResponsesMap = new Map();
        for (const r of rawResponses) {
            const key = `${r.employeeId}`;
            if (!latestResponsesMap.has(key)) {
                latestResponsesMap.set(key, r);
            }
        }
        const responses = Array.from(latestResponsesMap.values());
        const total = responses.length;
        let promotersCount = 0;
        let passivesCount = 0;
        let detractorsCount = 0;
        let totalScoreSum = 0;
        responses.forEach((r) => {
            totalScoreSum += r.score;
            if (r.score >= 9)
                promotersCount++;
            else if (r.score >= 7)
                passivesCount++;
            else
                detractorsCount++;
        });
        const score = total > 0
            ? Math.round(((promotersCount - detractorsCount) / total) * 100)
            : 0;
        const avgScore = total > 0
            ? Number((totalScoreSum / total).toFixed(1))
            : 0;
        const promotersPct = total > 0 ? Math.round((promotersCount / total) * 100) : 0;
        const passivesPct = total > 0 ? Math.round((passivesCount / total) * 100) : 0;
        const detractorsPct = total > 0 ? Math.max(0, 100 - promotersPct - passivesPct) : 0;
        return {
            score,
            avgScore,
            totalResponses: total,
            breakdown: {
                promoters: promotersCount,
                passives: passivesCount,
                detractors: detractorsCount,
                promotersPct,
                passivesPct,
                detractorsPct,
            },
            recentResponses: responses.slice(0, 20).map((r) => ({
                id: r.id,
                score: r.score,
                comment: r.comment,
                createdAt: r.createdAt,
                department: r.employee.department?.name || "-",
                position: r.employee.position?.title || "-",
                questionText: r.question?.question || "eNPS So'rovi",
            })),
        };
    }
}
exports.EnpsService = EnpsService;
exports.enpsService = new EnpsService();

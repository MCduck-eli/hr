"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiScreeningService = exports.AIScreeningService = void 0;
const db_1 = __importDefault(require("../../config/db"));
class AIScreeningService {
    async analyzeAndRankCandidate(candidateId, resumeText) {
        const candidateInfo = await db_1.default.candidate.findUnique({
            where: { id: candidateId },
            include: { primaryVacancy: true },
        });
        const targetCompany = candidateInfo?.companyName || candidateInfo?.primaryVacancy?.companyName;
        const openVacancies = await db_1.default.jobVacancy.findMany({
            where: {
                status: "OPEN",
                ...(targetCompany ? { companyName: targetCompany } : {}),
            },
        });
        if (openVacancies.length === 0)
            return;
        const matches = openVacancies.map((vacancy) => {
            const score = this.calculateMatchPercentage(resumeText, vacancy.requirements, vacancy.title);
            return {
                vacancyId: vacancy.id,
                matchScore: score,
                aiReason: `Automated AI match analysis rating: ${score}% match with requirements.`,
            };
        });
        matches.sort((a, b) => b.matchScore - a.matchScore);
        for (const match of matches) {
            await db_1.default.candidateMatch.upsert({
                where: {
                    candidateId_vacancyId: {
                        candidateId,
                        vacancyId: match.vacancyId,
                    },
                },
                update: {
                    matchScore: match.matchScore,
                    aiReason: match.aiReason,
                },
                create: {
                    candidateId,
                    vacancyId: match.vacancyId,
                    matchScore: match.matchScore,
                    aiReason: match.aiReason,
                },
            });
        }
        const candidate = await db_1.default.candidate.findUnique({
            where: { id: candidateId },
        });
        if (candidate && !candidate.primaryVacancyId && matches.length > 0) {
            await db_1.default.candidate.update({
                where: { id: candidateId },
                data: { primaryVacancyId: matches[0].vacancyId },
            });
        }
    }
    calculateMatchPercentage(resumeText, requirements, title) {
        const resumeWords = new Set(resumeText.toLowerCase().split(/\W+/));
        const reqWords = requirements
            .toLowerCase()
            .split(/\W+/)
            .filter((w) => w.length > 3);
        if (reqWords.length === 0)
            return 50;
        let matchCount = 0;
        reqWords.forEach((word) => {
            if (resumeWords.has(word))
                matchCount++;
        });
        if (resumeText.toLowerCase().includes(title.toLowerCase())) {
            matchCount += 2;
        }
        const percentage = Math.min(Math.round((matchCount / reqWords.length) * 100), 100);
        return Math.max(percentage, 15);
    }
}
exports.AIScreeningService = AIScreeningService;
exports.aiScreeningService = new AIScreeningService();

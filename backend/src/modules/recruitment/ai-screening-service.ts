import prisma from "../../config/db";

export class AIScreeningService {
    async analyzeAndRankCandidate(candidateId: string, resumeText: string) {
        const openVacancies = await prisma.jobVacancy.findMany({
            where: { status: "OPEN" },
        });

        if (openVacancies.length === 0) return;

        const matches = openVacancies.map((vacancy) => {
            const score = this.calculateMatchPercentage(
                resumeText,
                vacancy.requirements,
                vacancy.title,
            );
            return {
                vacancyId: vacancy.id,
                matchScore: score,
                aiReason: `Automated AI match analysis rating: ${score}% match with requirements.`,
            };
        });

        matches.sort((a, b) => b.matchScore - a.matchScore);

        for (const match of matches) {
            await prisma.candidateMatch.upsert({
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

        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
        });

        if (candidate && !candidate.primaryVacancyId && matches.length > 0) {
            await prisma.candidate.update({
                where: { id: candidateId },
                data: { primaryVacancyId: matches[0].vacancyId },
            });
        }
    }

    private calculateMatchPercentage(
        resumeText: string,
        requirements: string,
        title: string,
    ): number {
        const resumeWords = new Set(resumeText.toLowerCase().split(/\W+/));
        const reqWords = requirements
            .toLowerCase()
            .split(/\W+/)
            .filter((w) => w.length > 3);

        if (reqWords.length === 0) return 50;

        let matchCount = 0;
        reqWords.forEach((word) => {
            if (resumeWords.has(word)) matchCount++;
        });

        if (resumeText.toLowerCase().includes(title.toLowerCase())) {
            matchCount += 2;
        }

        const percentage = Math.min(
            Math.round((matchCount / reqWords.length) * 100),
            100,
        );
        return Math.max(percentage, 15);
    }
}

export const aiScreeningService = new AIScreeningService();

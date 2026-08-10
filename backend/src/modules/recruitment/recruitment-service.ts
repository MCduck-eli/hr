import { CandidatePipelineStage } from "@prisma/client";
import { VacancyStatus } from "@prisma/client";
import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { aiScreeningService } from "./ai-screening-service";

export class RecruitmentService {
    async createVacancy(payload: {
        title: string;
        description: string;
        requirements: string;
        departmentId?: string;
    }) {
        return prisma.jobVacancy.create({
            data: {
                title: payload.title,
                description: payload.description,
                requirements: payload.requirements,
                departmentId: payload.departmentId,
                status: VacancyStatus.OPEN,
            },
        });
    }

    async getAllVacancies() {
        return prisma.jobVacancy.findMany({
            include: {
                department: { select: { id: true, name: true } },
                _count: { select: { candidates: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async applyCandidate(payload: {
        fullName: string;
        email: string;
        phone: string;
        resumeUrl: string;
        resumeText: string;
        source?: string;
    }) {
        const candidate = await prisma.candidate.create({
            data: {
                fullName: payload.fullName,
                email: payload.email,
                phone: payload.phone,
                resumeUrl: payload.resumeUrl,
                source: payload.source || "DIRECT",
                stage: CandidatePipelineStage.APPLIED,
            },
        });

        await aiScreeningService.analyzeAndRankCandidate(
            candidate.id,
            payload.resumeText,
        );

        return this.getCandidateDetails(candidate.id);
    }

    async getCandidateDetails(candidateId: string) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
            include: {
                primaryVacancy: true,
                vacancyMatches: {
                    include: { vacancy: true },
                    orderBy: { matchScore: "desc" },
                },
                feedbacks: true,
            },
        });

        if (!candidate) {
            throw new AppError("Candidate not found", 404);
        }

        return candidate;
    }

    async updateStage(candidateId: string, stage: CandidatePipelineStage) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
        });

        if (!candidate) {
            throw new AppError("Candidate not found", 404);
        }

        const updated = await prisma.candidate.update({
            where: { id: candidateId },
            data: { stage },
        });

        if (stage === CandidatePipelineStage.HIRED) {
            await this.autoOnboardCandidate(candidate);
        }

        return updated;
    }

    async addFeedback(
        candidateId: string,
        reviewerId: string,
        payload: { score: number; comment: string },
    ) {
        return prisma.candidateFeedback.create({
            data: {
                candidateId,
                reviewerId,
                score: payload.score,
                comment: payload.comment,
            },
        });
    }

    private async autoOnboardCandidate(candidate: any) {
        const existingUser = await prisma.user.findUnique({
            where: { email: candidate.email },
        });

        if (!existingUser) {
            const nameParts = candidate.fullName.split(" ");
            const firstName = nameParts[0] || "New";
            const lastName = nameParts.slice(1).join(" ") || "Employee";

            const user = await prisma.user.create({
                data: {
                    email: candidate.email,
                    password: "DefaultPassword123!",
                    role: "EMPLOYEE",
                },
            });

            await prisma.employee.create({
                data: {
                    userId: user.id,
                    firstName,
                    lastName,
                },
            });
        }
    }
}

export const recruitmentService = new RecruitmentService();

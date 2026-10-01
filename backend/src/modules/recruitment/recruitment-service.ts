import { CandidatePipelineStage, VacancyStatus } from "@prisma/client";
import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { aiScreeningService } from "./ai-screening-service";
import { cvParserService } from "./cv-parser-service";
import { onboardingService } from "../onboarding/onboarding-service";
import { hashPassword } from "../../utils/password";


export class RecruitmentService {
    async createVacancy(payload: {
        title: string;
        companyName?: string;
        description: string;
        requirements: string;
        departmentId?: string;
    }, currentUser?: any) {
        let resolvedCompany = payload.companyName || null;
        if (!resolvedCompany && currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { companyName: true },
            });
            resolvedCompany = caller?.companyName || null;
        }

        return prisma.jobVacancy.create({
            data: {
                title: payload.title,
                companyName: resolvedCompany,
                description: payload.description,
                requirements: payload.requirements,
                departmentId: payload.departmentId || null,
                status: VacancyStatus.OPEN,
            },
        });
    }

    async updateVacancy(id: string, payload: {
        title?: string;
        companyName?: string;
        description?: string;
        requirements?: string;
        departmentId?: string;
        status?: VacancyStatus;
    }, currentUser?: any) {
        const vacancy = await prisma.jobVacancy.findUnique({ where: { id } });
        if (!vacancy) {
            throw new AppError("Vakansiya topilmadi", 404);
        }

        const isAdminOrHR =
            !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER" ||
            currentUser.role === "DEPARTMENT_HEAD";

        if (
            !isAdminOrHR &&
            currentUser?.companyName &&
            vacancy.companyName &&
            vacancy.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return prisma.jobVacancy.update({
            where: { id },
            data: {
                ...payload,
                departmentId: payload.departmentId || null,
            },
        });
    }

    async deleteVacancy(id: string, currentUser?: any) {
        const vacancy = await prisma.jobVacancy.findUnique({ where: { id } });
        if (!vacancy) {
            throw new AppError("Vakansiya topilmadi", 404);
        }

        const isAdminOrHR =
            !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER" ||
            currentUser.role === "DEPARTMENT_HEAD";

        if (
            !isAdminOrHR &&
            currentUser?.companyName &&
            vacancy.companyName &&
            vacancy.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return prisma.jobVacancy.delete({
            where: { id },
        });
    }

    async getAllVacancies(currentUser?: any) {
        return prisma.jobVacancy.findMany({
            include: {
                department: { select: { id: true, name: true } },
                candidates: {
                    include: {
                        vacancyMatches: true,
                    },
                },
                _count: { select: { candidates: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async getPublicVacancies(filters?: {
        companyName?: string;
        search?: string;
        departmentId?: string;
    }) {
        return prisma.jobVacancy.findMany({
            where: {
                status: VacancyStatus.OPEN,
                ...(filters?.companyName ? { companyName: filters.companyName } : {}),
                ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
                ...(filters?.search
                    ? {
                          OR: [
                              { title: { contains: filters.search, mode: "insensitive" } },
                              { description: { contains: filters.search, mode: "insensitive" } },
                              { requirements: { contains: filters.search, mode: "insensitive" } },
                          ],
                      }
                    : {}),
            },
            include: {
                department: { select: { id: true, name: true } },
                _count: { select: { candidates: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async getPublicVacancy(id: string) {
        const vacancy = await prisma.jobVacancy.findUnique({
            where: { id },
            include: {
                department: { select: { id: true, name: true } },
            },
        });

        if (!vacancy) {
            throw new AppError("Vakansiya topilmadi", 404);
        }

        return vacancy;
    }

    async parseResume(payload: { fileBuffer?: Buffer; mimeType?: string; rawText?: string }) {
        let textToParse = payload.rawText || "";
        if (payload.fileBuffer) {
            textToParse = cvParserService.extractTextFromBuffer(payload.fileBuffer, payload.mimeType);
        }
        return cvParserService.parseText(textToParse);
    }

    async applyCandidate(payload: {
        fullName: string;
        email: string;
        phone: string;
        resumeUrl: string;
        resumeText: string;
        source?: string;
        vacancyId?: string;
        location?: string;
        coverLetter?: string;
    }) {
        let vacancyCompany: string | null = null;
        if (payload.vacancyId) {
            const vac = await prisma.jobVacancy.findUnique({
                where: { id: payload.vacancyId },
                select: { companyName: true },
            });
            vacancyCompany = vac?.companyName || null;
        }

        const parsedData = cvParserService.parseText(payload.resumeText || "");
        const skillsToSave = parsedData.skills.length > 0 ? parsedData.skills : [];

        const candidate = await prisma.candidate.create({
            data: {
                fullName: payload.fullName || parsedData.fullName || "Nomzod",
                email: payload.email || parsedData.email,
                phone: payload.phone || parsedData.phone,
                resumeUrl: payload.resumeUrl,
                parsedSkills: skillsToSave,
                source: payload.source || "DIRECT",
                stage: CandidatePipelineStage.APPLIED,
                primaryVacancyId: payload.vacancyId || null,
                companyName: vacancyCompany,
                location: payload.location || parsedData.location,
                coverLetter: payload.coverLetter,
            },
        });

        await aiScreeningService.analyzeAndRankCandidate(
            candidate.id,
            payload.resumeText || parsedData.rawText,
        );

        return this.getCandidateDetails(candidate.id);
    }

    async getCandidateDetails(candidateId: string, currentUser?: any) {
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
            throw new AppError("Nomzod topilmadi", 404);
        }

        const isAdminOrHR =
            !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER";

        if (
            !isAdminOrHR &&
            currentUser?.companyName &&
            candidate.companyName &&
            candidate.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return candidate;
    }

    async updateStage(
        candidateId: string,
        stage: CandidatePipelineStage,
        testTaskDeadline?: Date | null,
        options?: {
            notifyCandidate?: boolean;
            notifyChannel?: "EMAIL" | "SMS" | "BOTH";
            customMessage?: string;
        },
        currentUser?: any,
    ) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
            include: { primaryVacancy: true },
        });

        if (!candidate) {
            throw new AppError("Nomzod topilmadi", 404);
        }

        const isAdminOrHR =
            !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER";

        if (
            !isAdminOrHR &&
            currentUser?.companyName &&
            candidate.companyName &&
            candidate.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const data: any = { stage };
        if (testTaskDeadline !== undefined) {
            data.testTaskDeadline = testTaskDeadline;
        }

        const updated = await prisma.candidate.update({
            where: { id: candidateId },
            data,
        });

        if (options?.notifyCandidate) {
            const channel = options.notifyChannel || "BOTH";
            const stageLabels: Record<string, string> = {
                APPLIED: "Arizangiz qabul qilindi",
                SCREENING: "Rezyume ko'rib chiqish bosqichi",
                INTERVIEW: "Suhbatga taklifnoma",
                TEST_TASK: "Test topshirig'i yuborildi",
                OFFER: "Ish taklifi (Job Offer)",
                HIRED: "Tabriklaymiz, ishga qabul qilindingiz!",
                REJECTED: "Arizangiz ko'rib chiqildi",
            };

            const defaultText = options.customMessage || `Hurmatli ${candidate.fullName}, sizning nomzodingiz "${candidate.primaryVacancy?.title || "Vakansiya"}" lavozimi bo'yicha "${stageLabels[stage] || stage}" bosqichiga o'tkazildi.`;

            if ((channel === "EMAIL" || channel === "BOTH") && candidate.email) {
                try {
                    await this.sendCandidateEmail(candidateId, {
                        subject: stageLabels[stage] || "Vakansiya bo'yicha xabarnoma",
                        text: defaultText,
                        type: stage,
                    }, currentUser);
                } catch (e) {}
            }

            if ((channel === "SMS" || channel === "BOTH") && candidate.phone) {
                try {
                    await this.sendCandidateSms(candidateId, {
                        message: defaultText,
                        type: stage,
                    }, currentUser);
                } catch (e) {}
            }
        }

        return updated;
    }

    async getPublicCandidateTask(candidateId: string) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
            select: {
                id: true,
                fullName: true,
                email: true,
                stage: true,
                testTaskDeadline: true,
                testTaskSubmissionUrl: true,
                testTaskSubmissionFile: true,
                testTaskSubmissionNote: true,
                testTaskSubmittedAt: true,
                primaryVacancy: {
                    select: {
                        id: true,
                        title: true,
                        companyName: true,
                        description: true,
                    },
                },
            },
        });

        if (!candidate) {
            throw new AppError("Nomzod ma'lumotlari topilmadi", 404);
        }

        return candidate;
    }

    async submitPublicCandidateTask(
        candidateId: string,
        payload: {
            submissionUrl?: string;
            submissionFile?: string;
            submissionNote?: string;
        },
    ) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
        });

        if (!candidate) {
            throw new AppError("Nomzod topilmadi", 404);
        }

        const updated = await prisma.candidate.update({
            where: { id: candidateId },
            data: {
                testTaskSubmissionUrl: payload.submissionUrl || candidate.testTaskSubmissionUrl,
                testTaskSubmissionFile: payload.submissionFile || candidate.testTaskSubmissionFile,
                testTaskSubmissionNote: payload.submissionNote || candidate.testTaskSubmissionNote,
                testTaskSubmittedAt: new Date(),
            },
        });

        return updated;
    }

    async addFeedback(
        candidateId: string,
        reviewerId: string,
        payload: { score: number; comment: string },
        currentUser?: any,
    ) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
        });

        if (!candidate) {
            throw new AppError("Nomzod topilmadi", 404);
        }

        const isAdminOrHR =
            !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER" ||
            currentUser.role === "DEPARTMENT_HEAD";

        if (
            !isAdminOrHR &&
            currentUser?.companyName &&
            candidate.companyName &&
            candidate.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return prisma.candidateFeedback.create({
            data: {
                candidateId,
                reviewerId,
                score: payload.score,
                comment: payload.comment,
            },
        });
    }

    async hireCandidate(
        candidateId: string,
        payload: { departmentId?: string; managerId?: string },
        currentUser?: any,
    ) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
            include: { primaryVacancy: true },
        });

        if (!candidate) {
            throw new AppError("Nomzod topilmadi", 404);
        }

        const isAdminOrHR =
            !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR";

        if (
            !isAdminOrHR &&
            currentUser?.companyName &&
            candidate.companyName &&
            candidate.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        if (candidate.stage === CandidatePipelineStage.HIRED) {
            throw new AppError("Nomzod allaqachon ishga qabul qilingan", 400);
        }

        const existingUser = await prisma.user.findFirst({
            where: { email: candidate.email },
        });

        if (existingUser) {
            throw new AppError("Ushbu email bilan foydalanuvchi mavjud", 400);
        }

        let resolvedCompany = candidate.companyName || candidate.primaryVacancy?.companyName || null;
        if (!resolvedCompany && currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { companyName: true },
            });
            resolvedCompany = caller?.companyName || null;
        }

        const nameParts = candidate.fullName.split(" ");
        const firstName = nameParts[0] || "New";
        const lastName = nameParts.slice(1).join(" ") || "Employee";
        const hashedPassword = await hashPassword("DefaultPassword123!");

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: candidate.email,
                    password: hashedPassword,
                    role: "EMPLOYEE",
                    companyName: resolvedCompany,
                },
            });

            const employee = await tx.employee.create({
                data: {
                    userId: user.id,
                    firstName,
                    lastName,
                    departmentId: payload.departmentId || null,
                    managerId: payload.managerId || null,
                },
            });

            const updatedCandidate = await tx.candidate.update({
                where: { id: candidateId },
                data: { stage: CandidatePipelineStage.HIRED },
            });

            return { employee, updatedCandidate };
        });

        await onboardingService.assignOnboarding({ employeeId: result.employee.id });

        return result.updatedCandidate;
    }

    async sendCandidateEmail(
        candidateId: string,
        payload: { subject: string; text: string; type: string },
        currentUser?: any,
    ) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!candidate) throw new AppError("Nomzod topilmadi", 404);

        const isAdminOrHR =
            !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER";

        if (
            !isAdminOrHR &&
            currentUser?.companyName &&
            candidate.companyName &&
            candidate.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }


        return { success: true };
    }

    async sendCandidateSms(
        candidateId: string,
        payload: { message: string; type?: string },
        currentUser?: any,
    ) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!candidate) throw new AppError("Nomzod topilmadi", 404);

        const isAdminOrHR =
            !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER";

        if (
            !isAdminOrHR &&
            currentUser?.companyName &&
            candidate.companyName &&
            candidate.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const cleanPhone = candidate.phone.replace(/[^\d+]/g, "");

        return {
            success: true,
            recipient: cleanPhone,
            message: payload.message,
            deliveredAt: new Date().toISOString(),
        };
    }
}

export const recruitmentService = new RecruitmentService();

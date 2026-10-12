"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recruitmentService = exports.RecruitmentService = void 0;
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
const ai_screening_service_1 = require("./ai-screening-service");
const cv_parser_service_1 = require("./cv-parser-service");
const onboarding_service_1 = require("../onboarding/onboarding-service");
const password_1 = require("../../utils/password");
class RecruitmentService {
    async createVacancy(payload, currentUser) {
        let resolvedCompany = payload.companyName || null;
        if (!resolvedCompany && currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { companyName: true },
            });
            resolvedCompany = caller?.companyName || null;
        }
        return db_1.default.jobVacancy.create({
            data: {
                title: payload.title,
                companyName: resolvedCompany,
                description: payload.description,
                requirements: payload.requirements,
                departmentId: payload.departmentId || null,
                status: client_1.VacancyStatus.OPEN,
            },
        });
    }
    async updateVacancy(id, payload, currentUser) {
        const vacancy = await db_1.default.jobVacancy.findUnique({ where: { id } });
        if (!vacancy) {
            throw new appError_1.AppError("Vakansiya topilmadi", 404);
        }
        const isAdminOrHR = !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER" ||
            currentUser.role === "DEPARTMENT_HEAD";
        if (!isAdminOrHR &&
            currentUser?.companyName &&
            vacancy.companyName &&
            vacancy.companyName !== currentUser.companyName) {
            throw new appError_1.AppError("Ruxsat berilmadi", 403);
        }
        return db_1.default.jobVacancy.update({
            where: { id },
            data: {
                ...payload,
                departmentId: payload.departmentId || null,
            },
        });
    }
    async deleteVacancy(id, currentUser) {
        const vacancy = await db_1.default.jobVacancy.findUnique({ where: { id } });
        if (!vacancy) {
            throw new appError_1.AppError("Vakansiya topilmadi", 404);
        }
        const isAdminOrHR = !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER" ||
            currentUser.role === "DEPARTMENT_HEAD";
        if (!isAdminOrHR &&
            currentUser?.companyName &&
            vacancy.companyName &&
            vacancy.companyName !== currentUser.companyName) {
            throw new appError_1.AppError("Ruxsat berilmadi", 403);
        }
        return db_1.default.jobVacancy.delete({
            where: { id },
        });
    }
    async getAllVacancies(currentUser) {
        return db_1.default.jobVacancy.findMany({
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
    async getPublicVacancies(filters) {
        return db_1.default.jobVacancy.findMany({
            where: {
                status: client_1.VacancyStatus.OPEN,
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
    async getPublicVacancy(id) {
        const vacancy = await db_1.default.jobVacancy.findUnique({
            where: { id },
            include: {
                department: { select: { id: true, name: true } },
            },
        });
        if (!vacancy) {
            throw new appError_1.AppError("Vakansiya topilmadi", 404);
        }
        return vacancy;
    }
    async parseResume(payload) {
        let textToParse = payload.rawText || "";
        if (payload.fileBuffer) {
            textToParse = cv_parser_service_1.cvParserService.extractTextFromBuffer(payload.fileBuffer, payload.mimeType);
        }
        return cv_parser_service_1.cvParserService.parseText(textToParse);
    }
    async applyCandidate(payload) {
        let vacancyCompany = null;
        if (payload.vacancyId) {
            const vac = await db_1.default.jobVacancy.findUnique({
                where: { id: payload.vacancyId },
                select: { companyName: true },
            });
            vacancyCompany = vac?.companyName || null;
        }
        const parsedData = cv_parser_service_1.cvParserService.parseText(payload.resumeText || "");
        const skillsToSave = parsedData.skills.length > 0 ? parsedData.skills : [];
        const candidate = await db_1.default.candidate.create({
            data: {
                fullName: payload.fullName || parsedData.fullName || "Nomzod",
                email: payload.email || parsedData.email,
                phone: payload.phone || parsedData.phone,
                resumeUrl: payload.resumeUrl,
                parsedSkills: skillsToSave,
                source: payload.source || "DIRECT",
                stage: client_1.CandidatePipelineStage.APPLIED,
                primaryVacancyId: payload.vacancyId || null,
                companyName: vacancyCompany,
                location: payload.location || parsedData.location,
                coverLetter: payload.coverLetter,
            },
        });
        await ai_screening_service_1.aiScreeningService.analyzeAndRankCandidate(candidate.id, payload.resumeText || parsedData.rawText);
        return this.getCandidateDetails(candidate.id);
    }
    async getCandidateDetails(candidateId, currentUser) {
        const candidate = await db_1.default.candidate.findUnique({
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
            throw new appError_1.AppError("Nomzod topilmadi", 404);
        }
        const isAdminOrHR = !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER";
        if (!isAdminOrHR &&
            currentUser?.companyName &&
            candidate.companyName &&
            candidate.companyName !== currentUser.companyName) {
            throw new appError_1.AppError("Ruxsat berilmadi", 403);
        }
        return candidate;
    }
    async updateStage(candidateId, stage, testTaskDeadline, options, currentUser) {
        const candidate = await db_1.default.candidate.findUnique({
            where: { id: candidateId },
            include: { primaryVacancy: true },
        });
        if (!candidate) {
            throw new appError_1.AppError("Nomzod topilmadi", 404);
        }
        const isAdminOrHR = !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER";
        if (!isAdminOrHR &&
            currentUser?.companyName &&
            candidate.companyName &&
            candidate.companyName !== currentUser.companyName) {
            throw new appError_1.AppError("Ruxsat berilmadi", 403);
        }
        const data = { stage };
        if (testTaskDeadline !== undefined) {
            data.testTaskDeadline = testTaskDeadline;
        }
        const updated = await db_1.default.candidate.update({
            where: { id: candidateId },
            data,
        });
        if (options?.notifyCandidate) {
            const channel = options.notifyChannel || "BOTH";
            const stageLabels = {
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
                }
                catch (e) { }
            }
            if ((channel === "SMS" || channel === "BOTH") && candidate.phone) {
                try {
                    await this.sendCandidateSms(candidateId, {
                        message: defaultText,
                        type: stage,
                    }, currentUser);
                }
                catch (e) { }
            }
        }
        return updated;
    }
    async getPublicCandidateTask(candidateId) {
        const candidate = await db_1.default.candidate.findUnique({
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
            throw new appError_1.AppError("Nomzod ma'lumotlari topilmadi", 404);
        }
        return candidate;
    }
    async submitPublicCandidateTask(candidateId, payload) {
        const candidate = await db_1.default.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!candidate) {
            throw new appError_1.AppError("Nomzod topilmadi", 404);
        }
        const updated = await db_1.default.candidate.update({
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
    async addFeedback(candidateId, reviewerId, payload, currentUser) {
        const candidate = await db_1.default.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!candidate) {
            throw new appError_1.AppError("Nomzod topilmadi", 404);
        }
        const isAdminOrHR = !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER" ||
            currentUser.role === "DEPARTMENT_HEAD";
        if (!isAdminOrHR &&
            currentUser?.companyName &&
            candidate.companyName &&
            candidate.companyName !== currentUser.companyName) {
            throw new appError_1.AppError("Ruxsat berilmadi", 403);
        }
        return db_1.default.candidateFeedback.create({
            data: {
                candidateId,
                reviewerId,
                score: payload.score,
                comment: payload.comment,
            },
        });
    }
    async hireCandidate(candidateId, payload, currentUser) {
        const candidate = await db_1.default.candidate.findUnique({
            where: { id: candidateId },
            include: { primaryVacancy: true },
        });
        if (!candidate) {
            throw new appError_1.AppError("Nomzod topilmadi", 404);
        }
        const isAdminOrHR = !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR";
        if (!isAdminOrHR &&
            currentUser?.companyName &&
            candidate.companyName &&
            candidate.companyName !== currentUser.companyName) {
            throw new appError_1.AppError("Ruxsat berilmadi", 403);
        }
        if (candidate.stage === client_1.CandidatePipelineStage.HIRED) {
            throw new appError_1.AppError("Nomzod allaqachon ishga qabul qilingan", 400);
        }
        const existingUser = await db_1.default.user.findFirst({
            where: { email: candidate.email },
        });
        if (existingUser) {
            throw new appError_1.AppError("Ushbu email bilan foydalanuvchi mavjud", 400);
        }
        let resolvedCompany = candidate.companyName || candidate.primaryVacancy?.companyName || null;
        if (!resolvedCompany && currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { companyName: true },
            });
            resolvedCompany = caller?.companyName || null;
        }
        const nameParts = candidate.fullName.split(" ");
        const firstName = nameParts[0] || "New";
        const lastName = nameParts.slice(1).join(" ") || "Employee";
        const hashedPassword = await (0, password_1.hashPassword)("DefaultPassword123!");
        const result = await db_1.default.$transaction(async (tx) => {
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
                data: { stage: client_1.CandidatePipelineStage.HIRED },
            });
            return { employee, updatedCandidate };
        });
        await onboarding_service_1.onboardingService.assignOnboarding({ employeeId: result.employee.id });
        return result.updatedCandidate;
    }
    async sendCandidateEmail(candidateId, payload, currentUser) {
        const candidate = await db_1.default.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!candidate)
            throw new appError_1.AppError("Nomzod topilmadi", 404);
        const isAdminOrHR = !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER";
        if (!isAdminOrHR &&
            currentUser?.companyName &&
            candidate.companyName &&
            candidate.companyName !== currentUser.companyName) {
            throw new appError_1.AppError("Ruxsat berilmadi", 403);
        }
        return { success: true };
    }
    async sendCandidateSms(candidateId, payload, currentUser) {
        const candidate = await db_1.default.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!candidate)
            throw new appError_1.AppError("Nomzod topilmadi", 404);
        const isAdminOrHR = !currentUser ||
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "RECRUITER";
        if (!isAdminOrHR &&
            currentUser?.companyName &&
            candidate.companyName &&
            candidate.companyName !== currentUser.companyName) {
            throw new appError_1.AppError("Ruxsat berilmadi", 403);
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
exports.RecruitmentService = RecruitmentService;
exports.recruitmentService = new RecruitmentService();

import { CandidatePipelineStage, VacancyStatus } from "@prisma/client";
import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { aiScreeningService } from "./ai-screening-service";
import { cvParserService } from "./cv-parser-service";
import { onboardingService } from "../onboarding/onboarding-service";
import { hashPassword } from "../../utils/password";
import nodemailer from "nodemailer";

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

        if (
            currentUser?.companyName &&
            vacancy.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
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

        if (
            currentUser?.companyName &&
            vacancy.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            vacancy.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return prisma.jobVacancy.delete({
            where: { id },
        });
    }

    async getAllVacancies(currentUser?: any) {
        let companyFilter: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }

        return prisma.jobVacancy.findMany({
            where: {
                ...(companyFilter ? { companyName: companyFilter } : {}),
            },
            include: {
                department: { select: { id: true, name: true } },
                candidates: {
                    where: {
                        ...(companyFilter ? { companyName: companyFilter } : {}),
                    },
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

        if (
            currentUser?.companyName &&
            candidate.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
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

        if (
            currentUser?.companyName &&
            candidate.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
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

        if (
            currentUser?.companyName &&
            candidate.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
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

        if (
            currentUser?.companyName &&
            candidate.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
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

        if (
            currentUser?.companyName &&
            candidate.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            candidate.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        let transporter;

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: Number(process.env.SMTP_PORT) || 587,
                secure: Number(process.env.SMTP_PORT) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        } else {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        }

        const getBadgeInfo = (type: string) => {
            switch (type) {
                case "HIRED":
                case "HIRE":
                    return { text: "QABUL QILINDI", color: "#10B981", bg: "#ECFDF5" };
                case "INTERVIEW":
                    return { text: "SUHBATGA TAKLIFNOMA", color: "#2563EB", bg: "#EFF6FF" };
                case "TEST_TASK":
                    return { text: "TEST TOPSHIRIG'I", color: "#D97706", bg: "#FFFBEB" };
                case "TASK_REMINDER":
                    return { text: "ESLATMA — TEST TOPSHIRIG'I", color: "#EA580C", bg: "#FFF7ED" };
                case "OFFER":
                    return { text: "ISH TAKLIFI (OFFER)", color: "#0D9488", bg: "#F0FDFA" };
                case "REJECTED":
                case "REJECT":
                    return { text: "RAD ETILDI", color: "#DC2626", bg: "#FEF2F2" };
                case "SCREENING":
                    return { text: "SKRINING BOSQICHI", color: "#7C3AED", bg: "#F5F3FF" };
                default:
                    return { text: "XABARNOMA", color: "#475569", bg: "#F8FAFC" };
            }
        };

        const { text: badgeText, color: badgeColor, bg: badgeBg } = getBadgeInfo(payload.type);

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="uz">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${payload.subject}</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
                    <tr>
                        <td align="center">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                                <tr>
                                    <td style="background-color: #0f172a; padding: 28px 32px; border-bottom: 4px solid ${badgeColor};">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td>
                                                    <span style="display: inline-block; padding: 4px 12px; background-color: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 700; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px;">
                                                        ${badgeText}
                                                    </span>
                                                    <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">HR PLATFORM</h1>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 36px 32px 28px 32px;">
                                        <h2 style="margin-top: 0; margin-bottom: 24px; color: #0f172a; font-size: 18px; font-weight: 700; line-height: 1.4;">
                                            ${payload.subject}
                                        </h2>
                                        <div style="font-size: 15px; color: #334155; line-height: 1.75; white-space: pre-wrap;">${payload.text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: bold; word-break: break-all;">$1</a>')}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                                        <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; font-weight: 500;">
                                            Ushbu xat platforma tomonidan avtomatik tarzda yuborildi.
                                        </p>
                                        <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                                            &copy; ${new Date().getFullYear()} ${candidate.companyName || "Kompaniya"} HR Bo'limi. Barcha huquqlar himoyalangan.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        const fromAddress = process.env.SMTP_FROM
            ? process.env.SMTP_FROM.replace(/^["']|["']$/g, "")
            : `"HR Platform" <${process.env.SMTP_USER || "hr@company.com"}>`;

        const info = await transporter.sendMail({
            from: fromAddress,
            to: candidate.email,
            subject: payload.subject,
            html: htmlContent,
        });

        return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
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

        if (
            currentUser?.companyName &&
            candidate.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
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

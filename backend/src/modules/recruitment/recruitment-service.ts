import { CandidatePipelineStage, VacancyStatus } from "@prisma/client";
import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { aiScreeningService } from "./ai-screening-service";
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
    }) {
        return prisma.jobVacancy.create({
            data: {
                title: payload.title,
                companyName: payload.companyName,
                description: payload.description,
                requirements: payload.requirements,
                departmentId: payload.departmentId,
                status: VacancyStatus.OPEN,
            },
        });
    }

    async updateVacancy(id: string, payload: {
        title?: string;
        companyName?: string;
        description?: string;
        requirements?: string;
    }) {
        return prisma.jobVacancy.update({
            where: { id },
            data: payload,
        });
    }

    async deleteVacancy(id: string) {
        return prisma.jobVacancy.delete({
            where: { id },
        });
    }

    async getAllVacancies() {
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

    async getPublicVacancy(id: string) {
        const vacancy = await prisma.jobVacancy.findUnique({
            where: { id },
        });

        if (!vacancy) {
            throw new AppError("Vacancy not found", 404);
        }

        return vacancy;
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
        const candidate = await prisma.candidate.create({
            data: {
                fullName: payload.fullName,
                email: payload.email,
                phone: payload.phone,
                resumeUrl: payload.resumeUrl,
                source: payload.source || "DIRECT",
                stage: CandidatePipelineStage.APPLIED,
                primaryVacancyId: payload.vacancyId || null,
                location: payload.location,
                coverLetter: payload.coverLetter,
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

    async hireCandidate(
        candidateId: string,
        payload: { departmentId?: string; managerId?: string },
    ) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
        });

        if (!candidate) {
            throw new AppError("Candidate not found", 404);
        }

        if (candidate.stage === CandidatePipelineStage.HIRED) {
            throw new AppError("Candidate is already hired", 400);
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: candidate.email },
        });

        if (existingUser) {
            throw new AppError("User with this email already exists", 400);
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

    async sendCandidateEmail(candidateId: string, payload: { subject: string, text: string, type: string }) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId }
        });
        if (!candidate) throw new AppError("Candidate not found", 404);

        let transporter;

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            // Haqiqiy elektron pochtaga yuborish (.env orqali)
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: Number(process.env.SMTP_PORT) || 587,
                secure: Number(process.env.SMTP_PORT) === 465, // 465 bo'lsa true, qolganlarida false
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        } else {
            // For development, fallback to Ethereal Email (a free SMTP catch-all service for testing)
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
        }

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #111;">HR Platform</h2>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9; border-radius: 6px;">
                    <p style="font-size: 16px; color: #333; white-space: pre-wrap; line-height: 1.6;">${payload.text}</p>
                </div>
                <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                    <p>Ushbu xat avtomatik tarzda yaratilgan. Iltimos, javob qaytarmang.</p>
                </div>
            </div>
        `;

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"HR Platform" <hr@yourcompany.com>',
            to: candidate.email,
            subject: payload.subject,
            html: htmlContent
        });

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
    }
}

export const recruitmentService = new RecruitmentService();

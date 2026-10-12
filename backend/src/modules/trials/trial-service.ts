import crypto from "crypto";
import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { hashPassword } from "../../utils/password";
import { sendTrialApprovalEmail } from "../../services/emailService";

export interface CreateTrialDto {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
}

export class TrialService {
    async createTrialRequest(data: CreateTrialDto) {
        const { firstName, lastName, phone, email } = data;

        if (!firstName?.trim() || !lastName?.trim() || !phone?.trim() || !email?.trim()) {
            throw new AppError("Barcha maydonlar to'ldirilishi shart", 400);
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingTrial = await prisma.trialRequest.findFirst({
            where: {
                email: { equals: normalizedEmail, mode: "insensitive" },
                status: { not: "REJECTED" },
            },
        });

        if (existingTrial) {
            throw new AppError(
                "Bu elektron pochta manzili allaqachon ro'yxatdan o'tgan yoki so'rov yuborilgan.",
                400,
            );
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                email: { equals: normalizedEmail, mode: "insensitive" },
            },
        });

        if (existingUser) {
            throw new AppError(
                "Bu elektron pochta manzili allaqachon ro'yxatdan o'tgan yoki so'rov yuborilgan.",
                400,
            );
        }

        const now = new Date();
        const trialEndDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

        return await prisma.trialRequest.create({
            data: {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim(),
                email: normalizedEmail,
                status: "TRIAL_ACTIVE",
                trialEndDate,
            },
        });
    }

    async getAllTrialRequests() {
        return await prisma.trialRequest.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    async approveTrialRequest(id: string) {
        const trial = await prisma.trialRequest.findUnique({
            where: { id },
        });

        if (!trial) {
            throw new AppError("Sinov so'rovi topilmadi", 404);
        }

        const plainPassword = crypto.randomBytes(4).toString("hex");
        const hashedPassword = await hashPassword(plainPassword);
        const defaultCompanyName = `${trial.firstName} ${trial.lastName} Tashkiloti`;

        const existingUser = await prisma.user.findUnique({
            where: { email: trial.email },
        });

        let user;
        if (existingUser) {
            user = await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    password: hashedPassword,
                    role: "DIRECTOR",
                    phone: existingUser.phone || trial.phone,
                    companyName: existingUser.companyName || defaultCompanyName,
                },
            });
        } else {
            user = await prisma.user.create({
                data: {
                    email: trial.email,
                    password: hashedPassword,
                    role: "DIRECTOR",
                    companyName: defaultCompanyName,
                    phone: trial.phone,
                    permissions: [],
                    employee: {
                        create: {
                            firstName: trial.firstName,
                            lastName: trial.lastName,
                            phone: trial.phone,
                            status: "ACTIVE",
                            statusStartedAt: new Date(),
                        },
                    },
                },
            });
        }

        const trialEndDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

        const updatedTrial = await prisma.trialRequest.update({
            where: { id },
            data: {
                status: "APPROVED",
                trialEndDate,
            },
        });

        try {
            await sendTrialApprovalEmail({
                to: trial.email,
                firstName: trial.firstName,
                lastName: trial.lastName,
                email: trial.email,
                plainPassword,
            });
        } catch (emailError: any) {
            console.error("Failed to send approval email:", emailError);
        }

        return {
            trial: updatedTrial,
            user: {
                id: user.id,
                email: user.email,
            },
        };
    }

    async rejectTrialRequest(id: string) {
        const trial = await prisma.trialRequest.findUnique({
            where: { id },
        });

        if (!trial) {
            throw new AppError("Sinov so'rovi topilmadi", 404);
        }

        const updatedTrial = await prisma.trialRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
            },
        });

        return updatedTrial;
    }
}

export const trialService = new TrialService();

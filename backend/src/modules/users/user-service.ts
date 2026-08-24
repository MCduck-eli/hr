import nodemailer from "nodemailer";
import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { hashPassword } from "../../utils/password";

export class UserService {
    async getAllUsers() {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                employee: {
                    include: {
                        department: true,
                        position: true,
                        grade: true,
                        feedbackReviewers: {
                            where: { isCompleted: false },
                            select: { id: true }
                        }
                    },
                },
            },
        });

        const currentCycle = await prisma.okrCycle.findFirst({
            where: { isCurrent: true },
        });

        if (!currentCycle) {
            return users;
        }

        const employeeIds = users.map(u => u.employee?.id).filter(Boolean) as string[];
        const objectives = await prisma.objective.findMany({
            where: {
                cycleId: currentCycle.id,
                level: "INDIVIDUAL",
                employeeId: { in: employeeIds }
            },
            select: {
                employeeId: true,
                progress: true
            }
        });

        const okrProgressByEmployee = employeeIds.reduce((acc, id) => {
            const employeeOkrs = objectives.filter(o => o.employeeId === id);
            if (employeeOkrs.length > 0) {
                const total = employeeOkrs.reduce((sum, okr) => sum + okr.progress, 0);
                acc[id] = Math.round(total / employeeOkrs.length);
            } else {
                acc[id] = 0;
            }
            return acc;
        }, {} as Record<string, number>);

        return users.map(user => {
            if (user.employee) {
                return {
                    ...user,
                    employee: {
                        ...user.employee,
                        okrProgress: okrProgressByEmployee[user.employee.id] || 0
                    }
                };
            }
            return user;
        });
    }

    async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                employee: {
                    include: {
                        department: true,
                        position: true,
                    },
                },
            },
        });

        if (!user) {
            throw new AppError("User not found", 404);
        }

        return user;
    }

    async createUser(payload: any) {
        const {
            email,
            password,
            role,
            firstName,
            lastName,
            departmentId,
            positionId,
            leaveBalance,
            assignedCourseIds,
        } = payload;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new AppError("User with this email already exists", 400);
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role || "EMPLOYEE",
                employee: {
                    create: {
                        firstName: firstName || "",
                        lastName: lastName || "",
                        ...(departmentId && { departmentId }),
                        ...(positionId && { positionId }),
                        ...(leaveBalance !== undefined && { leaveBalance }),
                        ...(assignedCourseIds &&
                            assignedCourseIds.length > 0 && {
                                courseProgresses: {
                                    create: assignedCourseIds.map(
                                        (id: string) => ({
                                            courseId: id,
                                        }),
                                    ),
                                },
                            }),
                    },
                },
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                employee: true,
            },
        });

        // Agar nomzod orqali qabul qilingan bo'lsa, nomzod holatini HIRED ga yangilash
        if (payload.candidateId) {
            await prisma.candidate.update({
                where: { id: payload.candidateId },
                data: { stage: "HIRED" },
            }).catch(() => {});
        } else {
            await prisma.candidate.updateMany({
                where: { email },
                data: { stage: "HIRED" },
            }).catch(() => {});
        }

        // Yangi qabul qilingan xodimning emailiga chiroyli xush kelibsiz (qabul qilindi) xati yuborish
        try {
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

            const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Xodim";
            const appUrl = process.env.APP_URL || "http://localhost:3000";

            const htmlContent = `
                <!DOCTYPE html>
                <html lang="uz">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Tabriklaymiz! Siz ishga qabul qilindingiz</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
                        <tr>
                            <td align="center">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                                    <tr>
                                        <td style="background-color: #0f172a; padding: 28px 32px; border-bottom: 4px solid #10B981;">
                                            <span style="display: inline-block; padding: 4px 12px; background-color: #ECFDF5; color: #10B981; font-size: 11px; font-weight: 700; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px;">
                                                QABUL QILINDI
                                            </span>
                                            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">HR PLATFORM</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 36px 32px 28px 32px;">
                                            <h2 style="margin-top: 0; margin-bottom: 20px; color: #0f172a; font-size: 18px; font-weight: 700;">
                                                Tabriklaymiz! Siz jamoamiz safiga qabul qilindingiz 🎉
                                            </h2>
                                            <p style="font-size: 15px; color: #334155; line-height: 1.75; margin-bottom: 20px;">
                                                Hurmatli <strong>${fullName}</strong>,<br><br>
                                                Sizni jamoamizga muvaffaqiyatli qabul qilinganingiz bilan chin qalbimizdan tabriklaymiz! Sizning bilim va tajribangiz umumiy yutuqlarimizga katta hissa qo‘shishiga ishonamiz.
                                            </p>
                                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                                                <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Platformaga kirish ma'lumotlari:</div>
                                                <div style="font-size: 14px; margin-bottom: 8px;"><strong>📧 Login (Email):</strong> <span style="color: #2563eb; font-weight: 600;">${email}</span></div>
                                                <div style="font-size: 14px; margin-bottom: 14px;"><strong>🔑 Parol:</strong> <code style="background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-family: monospace;">${password}</code></div>
                                                <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 700; margin-top: 4px;">Platformaga kirish &rarr;</a>
                                            </div>
                                            <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0;">
                                                Tez orada siz bilan HR bo‘limi xodimlari bog‘lanib, ish faoliyatingizni boshlash bo‘yicha kerakli ko‘rsatmalarni berishadi.
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                                            <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                                                &copy; ${new Date().getFullYear()} HR Platform. Barcha huquqlar himoyalangan.
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

            const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@hrplatform.com";
            const cleanFrom = fromAddress.includes("<")
                ? fromAddress
                : `"HR Platform" <${fromAddress}>`;

            await transporter.sendMail({
                from: cleanFrom,
                to: email,
                subject: "Tabriklaymiz! Siz ishga qabul qilindingiz — HR Platform",
                text: `Hurmatli ${fullName},\n\nSizni jamoamizga qabul qilinganingiz bilan tabriklaymiz!\n\nEmail: ${email}\nParol: ${password}\n\nKirish: ${appUrl}\n\nHurmat bilan,\nHR Bo'limi`,
                html: htmlContent,
            });
        } catch (err) {
            console.error("Welcome email send error:", err);
        }

        return newUser;
    }
    async updateUser(id: string, payload: any) {
        const userExists = await prisma.user.findUnique({
            where: { id },
            include: { employee: true },
        });

        if (!userExists) {
            throw new AppError("User not found", 404);
        }

        const {
            email,
            role,
            firstName,
            lastName,
            departmentId,
            positionId,
            password,
            leaveBalance,
            assignedCourseIds,
        } = payload;

        let hashedPassword;
        if (password) {
            hashedPassword = await hashPassword(password);
        }

        if (assignedCourseIds && userExists.employee) {
            await prisma.courseProgress.deleteMany({
                where: { employeeId: userExists.employee.id },
            });
            await prisma.courseProgress.createMany({
                data: assignedCourseIds.map((cId: string) => ({
                    employeeId: userExists.employee!.id,
                    courseId: cId,
                })),
            });
        }

        return prisma.user.update({
            where: { id },
            data: {
                ...(email && { email }),
                ...(role && { role }),
                ...(hashedPassword && { password: hashedPassword }),
                employee: {
                    update: {
                        ...(firstName !== undefined && { firstName }),
                        ...(lastName !== undefined && { lastName }),
                        ...(departmentId !== undefined && {
                            departmentId:
                                departmentId === "" ? null : departmentId,
                        }),
                        ...(positionId !== undefined && {
                            positionId: positionId === "" ? null : positionId,
                        }),
                        ...(leaveBalance !== undefined && { leaveBalance }),
                    },
                },
            },
            select: {
                id: true,
                email: true,
                role: true,
                employee: true,
            },
        });
    }
    async deleteUser(id: string) {
        const userExists = await prisma.user.findUnique({
            where: { id },
        });

        if (!userExists) {
            throw new AppError("User not found", 404);
        }

        await prisma.employee.deleteMany({
            where: { userId: id },
        });

        return prisma.user.delete({
            where: { id },
        });
    }
}

export const userService = new UserService();

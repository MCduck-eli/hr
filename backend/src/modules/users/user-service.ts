import nodemailer from "nodemailer";
import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { hashPassword } from "../../utils/password";
import { employeeStatusService } from "../employee-status/employee-status-service";

export class UserService {
    async getAllUsers(currentUser?: any) {
        await employeeStatusService.checkAndTransitionEmployeeStatuses();

        let companyNameFilter: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyNameFilter = caller.companyName || null;
            }
        }

        const whereClause: any = {};
        if (companyNameFilter) {
            whereClause.companyName = companyNameFilter;
            whereClause.role = { not: "SUPER_ADMIN" };
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                email: true,
                role: true,
                companyName: true,
                phone: true,
                createdAt: true,
                employee: {
                    include: {
                        department: true,
                        position: true,
                        grade: true,
                        statusConfig: {
                            include: { nextStatus: true },
                        },
                        feedbackReviewers: {
                            where: { isCompleted: false },
                            select: { id: true },
                        },
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

        const objectives = await prisma.objective.findMany({
            where: {
                cycleId: currentCycle.id,
            },
            select: {
                id: true,
                level: true,
                departmentId: true,
                employeeId: true,
                progress: true,
            },
        });

        const okrProgressByEmployee = users.reduce((acc, u) => {
            if (!u.employee) return acc;
            const empId = u.employee.id;
            const deptId = u.employee.departmentId;

            const relevantOkrs = objectives.filter((o) => {
                if (o.level === "COMPANY") return true;
                if (o.level === "DEPARTMENT" && deptId && o.departmentId === deptId) return true;
                if (o.level === "INDIVIDUAL" && o.employeeId === empId) return true;
                return false;
            });

            if (relevantOkrs.length > 0) {
                const total = relevantOkrs.reduce((sum, okr) => sum + okr.progress, 0);
                acc[empId] = Math.round(total / relevantOkrs.length);
            } else {
                acc[empId] = 0;
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
                companyName: true,
                phone: true,
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

    async createUser(payload: any, currentUser?: any) {
        const {
            email,
            password,
            role,
            firstName,
            lastName,
            companyName,
            phone,
            departmentId,
            positionId,
            leaveBalance,
            assignedCourseIds,
        } = payload;

        let finalCompanyName = companyName || null;
        if (!finalCompanyName && currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { companyName: true },
            });
            if (caller?.companyName) {
                finalCompanyName = caller.companyName;
            }
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new AppError("Ushbu email bilan foydalanuvchi allaqachon mavjud", 400);
        }

        const hashedPassword = await hashPassword(password);

        let statusConfigId = payload.statusConfigId;
        let statusConfig = null;
        if (statusConfigId) {
            statusConfig = await prisma.employeeStatusConfig.findUnique({
                where: { id: statusConfigId },
            });
        }
        if (!statusConfig && payload.status) {
            statusConfig = await prisma.employeeStatusConfig.findFirst({
                where: {
                    OR: [
                        { code: payload.status },
                        { id: payload.status },
                        { name: payload.status },
                    ],
                },
            });
            if (statusConfig) {
                statusConfigId = statusConfig.id;
            }
        }

        if (!statusConfig) {
            statusConfig = await prisma.employeeStatusConfig.findFirst({
                where: { code: "NEW" },
            });
            if (statusConfig) {
                statusConfigId = statusConfig.id;
            }
        }

        const statusExpiresAt = statusConfig?.durationDays
            ? new Date(
                  Date.now() +
                      statusConfig.durationDays * 24 * 60 * 60 * 1000,
              )
            : null;

        let enumStatus: any = "ACTIVE";
        if (statusConfig?.code === "NEW" || payload.status === "NEW") {
            enumStatus = "NEW";
        } else if (
            statusConfig?.code === "INACTIVE" ||
            payload.status === "INACTIVE"
        ) {
            enumStatus = "INACTIVE";
        }

        let resolvedPositionId = null;
        if (positionId && typeof positionId === "string" && positionId.trim()) {
            const trimmedPos = positionId.trim();
            const existingPos = await prisma.position.findFirst({
                where: {
                    OR: [
                        { id: trimmedPos },
                        { title: { equals: trimmedPos, mode: "insensitive" } },
                    ],
                },
            });
            if (existingPos) {
                resolvedPositionId = existingPos.id;
            } else {
                const newPos = await prisma.position.create({
                    data: {
                        title: trimmedPos,
                        departmentId: departmentId || null,
                    },
                }).catch(() => null);
                if (newPos) {
                    resolvedPositionId = newPos.id;
                }
            }
        }

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role || "EMPLOYEE",
                companyName: finalCompanyName,
                phone: phone || null,
                employee: {
                    create: {
                        firstName: firstName || "",
                        lastName: lastName || "",
                        status: enumStatus,
                        statusConfigId: statusConfigId || undefined,
                        statusStartedAt: new Date(),
                        statusExpiresAt,
                        ...(departmentId && { departmentId }),
                        ...(resolvedPositionId && { positionId: resolvedPositionId }),
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
                companyName: true,
                phone: true,
                createdAt: true,
                employee: true,
            },
        });

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
            companyName,
            phone,
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

        let statusConfigId = payload.statusConfigId;
        let statusExpiresAt: any = undefined;
        let statusStartedAt: any = undefined;
        let enumStatus = payload.status;

        if (payload.statusConfigId !== undefined || payload.status !== undefined) {
            let statusConfig = null;
            if (statusConfigId) {
                statusConfig = await prisma.employeeStatusConfig.findUnique({
                    where: { id: statusConfigId },
                });
            }
            if (!statusConfig && payload.status) {
                statusConfig = await prisma.employeeStatusConfig.findFirst({
                    where: {
                        OR: [
                            { code: payload.status },
                            { id: payload.status },
                            { name: payload.status },
                        ],
                    },
                });
                if (statusConfig) {
                    statusConfigId = statusConfig.id;
                }
            }

            if (statusConfig) {
                statusStartedAt = new Date();
                statusExpiresAt = statusConfig.durationDays
                    ? new Date(
                          Date.now() +
                              statusConfig.durationDays * 24 * 60 * 60 * 1000,
                      )
                    : null;

                if (statusConfig.code === "NEW") {
                    enumStatus = "NEW";
                } else if (statusConfig.code === "INACTIVE") {
                    enumStatus = "INACTIVE";
                } else {
                    enumStatus = "ACTIVE";
                }
            }
        }

        let resolvedPositionId: string | null | undefined = undefined;
        if (positionId !== undefined) {
            if (!positionId || positionId === "") {
                resolvedPositionId = null;
            } else {
                const trimmedPos = String(positionId).trim();
                const existingPos = await prisma.position.findFirst({
                    where: {
                        OR: [
                            { id: trimmedPos },
                            { title: { equals: trimmedPos, mode: "insensitive" } },
                        ],
                    },
                });
                if (existingPos) {
                    resolvedPositionId = existingPos.id;
                } else {
                    const newPos = await prisma.position.create({
                        data: {
                            title: trimmedPos,
                            departmentId: departmentId || null,
                        },
                    }).catch(() => null);
                    resolvedPositionId = newPos ? newPos.id : null;
                }
            }
        }

        return prisma.user.update({
            where: { id },
            data: {
                ...(email && { email }),
                ...(role && { role }),
                ...(companyName !== undefined && { companyName }),
                ...(phone !== undefined && { phone }),
                ...(hashedPassword && { password: hashedPassword }),
                employee: {
                    update: {
                        ...(firstName !== undefined && { firstName }),
                        ...(lastName !== undefined && { lastName }),
                        ...(departmentId !== undefined && {
                            departmentId:
                                departmentId === "" ? null : departmentId,
                        }),
                        ...(resolvedPositionId !== undefined && {
                            positionId: resolvedPositionId,
                        }),
                        ...(leaveBalance !== undefined && { leaveBalance }),
                        ...(enumStatus !== undefined && { status: enumStatus }),
                        ...(statusConfigId !== undefined && {
                            statusConfigId,
                        }),
                        ...(statusStartedAt !== undefined && {
                            statusStartedAt,
                        }),
                        ...(statusExpiresAt !== undefined && {
                            statusExpiresAt,
                        }),
                    },
                },
            },
            select: {
                id: true,
                email: true,
                role: true,
                companyName: true,
                phone: true,
                employee: true,
            },
        });
    }
    async deleteUser(id: string) {
        const userExists = await prisma.user.findUnique({
            where: { id },
            include: { employee: true },
        });

        if (!userExists) {
            throw new AppError("User not found", 404);
        }

        if (userExists.role === "DIRECTOR") {
            const companyName = userExists.companyName;

            const remainingDirectors = await prisma.user.count({
                where: {
                    role: "DIRECTOR",
                    id: { not: id },
                },
            });

            if (remainingDirectors === 0) {
                const companyTables = [
                    "Attendance",
                    "WorkSchedule",
                    "LeaveRequest",
                    "Payroll",
                    "PerformanceReview",
                    "DeviceLog",
                    "CandidateFeedback",
                    "CandidateMatch",
                    "Candidate",
                    "JobVacancy",
                    "EmployeeOnboardingTask",
                    "EmployeeOnboardingCourse",
                    "EmployeeOnboarding",
                    "OnboardingTask",
                    "OnboardingCourse",
                    "OnboardingTemplate",
                    "PolicySignature",
                    "CompanyPolicy",
                    "CourseProgress",
                    "CourseCertificate",
                    "EventRegistration",
                    "TrainingEvent",
                    "AcademyQuiz",
                    "AcademyResource",
                    "AcademyLesson",
                    "AcademyCourse",
                    "AcademyCategory",
                    "OrgStructureHistory",
                    "EmployeeLifecycleEvent",
                    "OffboardingTaskItem",
                    "OffboardingRequest",
                    "EmployeeLifecycleChecklist",
                    "LifecycleTemplateTask",
                    "LifecycleTemplate",
                    "OkrCheckIn",
                    "KeyResult",
                    "Objective",
                    "OkrCycle",
                    "DiscUserResponse",
                    "DiscAssessment",
                    "FeedbackAnswer",
                    "FeedbackAssignment",
                    "FeedbackQuestion",
                    "FeedbackCycle",
                    "PromotionRequest",
                    "CareerHistory",
                    "JobGrade",
                    "GeofenceZone",
                    "Position",
                    "Department",
                ];

                const truncateSql = `TRUNCATE TABLE ${companyTables.map((t) => `"${t}"`).join(", ")} CASCADE;`;
                await prisma.$executeRawUnsafe(truncateSql).catch(async () => {
                    for (const t of companyTables) {
                        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${t}" CASCADE;`).catch(() => {});
                    }
                });

                await prisma.notification.deleteMany({
                    where: { user: { role: { not: "SUPER_ADMIN" } } },
                }).catch(() => {});
                await prisma.userDeviceToken.deleteMany({
                    where: { user: { role: { not: "SUPER_ADMIN" } } },
                }).catch(() => {});
                await prisma.employee.deleteMany({
                    where: { user: { role: { not: "SUPER_ADMIN" } } },
                }).catch(() => {});
                await prisma.user.deleteMany({
                    where: { role: { not: "SUPER_ADMIN" } },
                }).catch(() => {});

                return { success: true, id };
            }

            const companyUsers = await prisma.user.findMany({
                where: companyName ? { companyName } : { id },
                include: { employee: true },
            });

            const companyUserIds = companyUsers.map((u) => u.id);
            const companyEmpIds = companyUsers
                .map((u) => u.employee?.id)
                .filter(Boolean) as string[];

            if (companyEmpIds.length > 0) {
                await prisma.attendance.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => {});
                await prisma.workSchedule.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => {});
                await prisma.leaveRequest.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => {});
                await prisma.payroll.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => {});
                await prisma.performanceReview.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => {});
                await prisma.employeeOnboarding.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => {});
                await prisma.policySignature.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => {});
                await prisma.courseProgress.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => {});
                await prisma.eventRegistration.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => {});
                await prisma.objective.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => {});
                await prisma.feedbackAssignment.deleteMany({
                    where: {
                        OR: [
                            { targetId: { in: companyEmpIds } },
                            { reviewerId: { in: companyEmpIds } }
                        ]
                    }
                }).catch(() => {});
                await prisma.discAssessment.deleteMany({ where: { employeeId: { in: companyEmpIds } } }).catch(() => {});
                await prisma.employee.deleteMany({ where: { id: { in: companyEmpIds } } }).catch(() => {});
            }

            if (companyUserIds.length > 0) {
                await prisma.notification.deleteMany({ where: { userId: { in: companyUserIds } } }).catch(() => {});
                await prisma.userDeviceToken.deleteMany({ where: { userId: { in: companyUserIds } } }).catch(() => {});
                await prisma.user.deleteMany({ where: { id: { in: companyUserIds } } }).catch(() => {});
            }

            return { success: true, id };
        }

        const emp = userExists.employee;
        if (emp) {
            await prisma.employee.updateMany({
                where: { managerId: emp.id },
                data: { managerId: null },
            }).catch(() => {});
            await prisma.employeeOnboarding.updateMany({
                where: { mentorId: emp.id },
                data: { mentorId: null },
            }).catch(() => {});
            await prisma.attendance.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.workSchedule.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.leaveRequest.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.payroll.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.performanceReview.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.feedbackAssignment.deleteMany({
                where: { OR: [{ reviewerId: emp.id }, { targetId: emp.id }] },
            }).catch(() => {});
            await prisma.okrCheckIn.deleteMany({ where: { objective: { employeeId: emp.id } } }).catch(() => {});
            await prisma.keyResult.deleteMany({ where: { objective: { employeeId: emp.id } } }).catch(() => {});
            await prisma.objective.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.discUserResponse.deleteMany({ where: { assessment: { employeeId: emp.id } } }).catch(() => {});
            await prisma.discAssessment.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.employeeOnboardingTask.deleteMany({ where: { employeeOnboarding: { employeeId: emp.id } } }).catch(() => {});
            await prisma.employeeOnboardingCourse.deleteMany({ where: { employeeOnboarding: { employeeId: emp.id } } }).catch(() => {});
            await prisma.employeeOnboarding.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.policySignature.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.courseProgress.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.courseCertificate.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.eventRegistration.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.employeeLifecycleChecklist.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.offboardingRequest.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.employeeLifecycleEvent.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
            await prisma.orgStructureHistory.deleteMany({
                where: { OR: [{ employeeId: emp.id }, { changedById: emp.id }] },
            }).catch(() => {});
            await prisma.employee.delete({ where: { id: emp.id } }).catch(() => {});
        }

        await prisma.notification.deleteMany({ where: { userId: id } }).catch(() => {});
        await prisma.userDeviceToken.deleteMany({ where: { userId: id } }).catch(() => {});

        return prisma.user.delete({
            where: { id },
        }).catch(() => ({ id }));
    }
}

export const userService = new UserService();

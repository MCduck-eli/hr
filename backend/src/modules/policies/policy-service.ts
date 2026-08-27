import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { notificationService } from "../notification/notification-service";

export class PolicyService {
    async createPolicy(
        payload: {
            title: string;
            description?: string;
            content?: string;
            documentUrl?: string;
            isRequired?: boolean;
            parentId?: string;
        },
        creatorUserId?: string,
    ) {
        const policy = await prisma.companyPolicy.create({
            data: {
                title: payload.title,
                description: payload.description,
                content: payload.content,
                documentUrl: payload.documentUrl,
                isRequired: payload.isRequired ?? true,
                parentId: payload.parentId,
            },
        });

        try {
            await notificationService.notifyAllUsers({
                title: "Yangi Nizom Qo'shildi",
                message: `"${payload.title}" ichki nizomi tizimga yuklandi. Iltimos, tanishib chiqing.`,
                type: "GENERAL",
                excludeUserId: creatorUserId,
                excludeRoles: ["SUPER_ADMIN", "HR_ADMIN"],
                metadata: {
                    type: "REGULATION",
                    policyId: policy.id,
                    link: "/regulations",
                },
            });
        } catch (e) {}

        return policy;
    }

    async updatePolicy(
        policyId: string,
        payload: {
            title?: string;
            description?: string;
            content?: string;
            documentUrl?: string;
            isRequired?: boolean;
        },
        updaterUserId?: string,
    ) {
        const existing = await prisma.companyPolicy.findUnique({
            where: { id: policyId },
        });

        if (!existing) {
            throw new AppError("Policy not found", 404);
        }

        const isContentUpdated =
            (payload.content !== undefined && payload.content !== existing.content) ||
            (payload.documentUrl !== undefined && payload.documentUrl !== existing.documentUrl) ||
            (payload.title !== undefined && payload.title !== existing.title);

        const newVersion = isContentUpdated ? existing.version + 1 : existing.version;

        const updated = await prisma.companyPolicy.update({
            where: { id: policyId },
            data: {
                ...payload,
                version: newVersion,
            },
        });

        if (isContentUpdated) {
            try {
                await notificationService.notifyAllUsers({
                    title: "Nizom Yangilandi",
                    message: `"${updated.title}" ichki nizomining yangi versiyasi (v${newVersion}) yuklandi. Qayta tanishib chiqishingiz lozim.`,
                    type: "GENERAL",
                    excludeUserId: updaterUserId,
                    excludeRoles: ["SUPER_ADMIN", "HR_ADMIN"],
                    metadata: {
                        type: "REGULATION",
                        policyId: updated.id,
                        link: "/regulations",
                    },
                });
            } catch (e) {}
        }

        return updated;
    }

    async deletePolicy(policyId: string) {
        const existing = await prisma.companyPolicy.findUnique({
            where: { id: policyId },
        });

        if (!existing) {
            throw new AppError("Policy not found", 404);
        }

        return prisma.companyPolicy.delete({
            where: { id: policyId },
        });
    }

    async getPolicyById(policyId: string, userId?: string) {
        const policy = await prisma.companyPolicy.findUnique({
            where: { id: policyId },
            include: {
                signatures: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                department: true,
                                user: {
                                    select: {
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!policy) {
            throw new AppError("Policy not found", 404);
        }

        let isSigned = false;
        let signedAt: Date | null = null;
        let signedVersion: number | null = null;

        if (userId) {
            const employee = await prisma.employee.findFirst({
                where: {
                    OR: [{ userId }, { id: userId }],
                },
            });
            if (employee) {
                const userSignature = policy.signatures.find(
                    (s) => s.employeeId === employee.id,
                );
                if (userSignature) {
                    isSigned = true;
                    signedAt = userSignature.signedAt;
                    signedVersion = userSignature.signedVersion;
                }
            }
        }

        return {
            ...policy,
            isSigned,
            signedAt,
            signedVersion,
            isUpToDateSigned: signedVersion === policy.version,
        };
    }

    async getAllPolicies(userId: string, role?: string, search?: string) {
        const where: any = { parentId: null };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ];
        }

        let employee = await prisma.employee.findFirst({
            where: {
                OR: [{ userId }, { id: userId }],
            },
        });

        if (!employee && (role === "SUPER_ADMIN" || role === "HR_ADMIN")) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                employee = await prisma.employee.create({
                    data: {
                        userId: user.id,
                        firstName: user.firstName || "Admin",
                        lastName: user.lastName || "User",
                        status: "NEW",
                    },
                });
            }
        }

        const isAdmin = role === "SUPER_ADMIN" || role === "HR_ADMIN";

        const [policies, totalEmployees] = await Promise.all([
            prisma.companyPolicy.findMany({
                where,
                include: {
                    children: true,
                    signatures: {
                        include: {
                            employee: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    department: true,
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.employee.count({
                where: {
                    user: {
                        role: {
                            not: "SUPER_ADMIN",
                        },
                    },
                },
            }),
        ]);

        return policies.map((policy) => {
            const currentEmployeeSignature = employee
                ? policy.signatures.find((s) => s.employeeId === employee.id)
                : null;

            const upToDateSignatures = policy.signatures.filter(
                (s) => s.signedVersion === policy.version,
            );

            const signedCount = upToDateSignatures.length;
            const signedPercentage =
                totalEmployees > 0
                    ? Math.round((signedCount / totalEmployees) * 100)
                    : 0;

            return {
                id: policy.id,
                title: policy.title,
                description: policy.description,
                content: policy.content,
                documentUrl: policy.documentUrl,
                version: policy.version,
                isRequired: policy.isRequired,
                createdAt: policy.createdAt,
                updatedAt: policy.updatedAt,
                isSigned: Boolean(currentEmployeeSignature),
                signedVersion: currentEmployeeSignature?.signedVersion || null,
                signedAt: currentEmployeeSignature?.signedAt || null,
                isUpToDateSigned: currentEmployeeSignature
                    ? currentEmployeeSignature.signedVersion === policy.version
                    : false,
                stats: isAdmin
                    ? {
                          totalEmployees,
                          signedCount,
                          signedPercentage,
                          signatures: policy.signatures.map((s) => ({
                              id: s.id,
                              employeeId: s.employeeId,
                              employeeName: `${s.employee.firstName} ${s.employee.lastName}`,
                              email: s.employee.user.email,
                              department: s.employee.department?.name || null,
                              signedVersion: s.signedVersion,
                              isCurrentVersion: s.signedVersion === policy.version,
                              signedAt: s.signedAt,
                          })),
                      }
                    : undefined,
            };
        });
    }

    async signPolicy(userId: string, policyId: string) {
        let employee = await prisma.employee.findFirst({
            where: {
                OR: [{ userId }, { id: userId }],
            },
        });

        if (!employee) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new AppError("Foydalanuvchi topilmadi", 404);
            }
            employee = await prisma.employee.create({
                data: {
                    userId: user.id,
                    firstName: user.firstName || "Foydalanuvchi",
                    lastName: user.lastName || "",
                    status: "NEW",
                },
            });
        }

        const policy = await prisma.companyPolicy.findUnique({
            where: { id: policyId },
        });

        if (!policy) {
            throw new AppError("Nizom topilmadi", 404);
        }

        return prisma.policySignature.upsert({
            where: {
                policyId_employeeId: {
                    policyId,
                    employeeId: employee.id,
                },
            },
            update: {
                signedVersion: policy.version,
                signedAt: new Date(),
            },
            create: {
                policyId,
                employeeId: employee.id,
                signedVersion: policy.version,
            },
        });
    }
}

export const policyService = new PolicyService();

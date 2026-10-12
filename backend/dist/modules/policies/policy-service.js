"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyService = exports.PolicyService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
const notification_service_1 = require("../notification/notification-service");
class PolicyService {
    async createPolicy(payload, creatorUserId) {
        const policy = await db_1.default.companyPolicy.create({
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
            await notification_service_1.notificationService.notifyAllUsers({
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
        }
        catch (e) { }
        return policy;
    }
    async updatePolicy(policyId, payload, updaterUserId) {
        const existing = await db_1.default.companyPolicy.findUnique({
            where: { id: policyId },
        });
        if (!existing) {
            throw new appError_1.AppError("Policy not found", 404);
        }
        const isContentUpdated = (payload.content !== undefined && payload.content !== existing.content) ||
            (payload.documentUrl !== undefined && payload.documentUrl !== existing.documentUrl) ||
            (payload.title !== undefined && payload.title !== existing.title);
        const newVersion = isContentUpdated ? existing.version + 1 : existing.version;
        const updated = await db_1.default.companyPolicy.update({
            where: { id: policyId },
            data: {
                ...payload,
                version: newVersion,
            },
        });
        if (isContentUpdated) {
            try {
                await notification_service_1.notificationService.notifyAllUsers({
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
            }
            catch (e) { }
        }
        return updated;
    }
    async deletePolicy(policyId) {
        const existing = await db_1.default.companyPolicy.findUnique({
            where: { id: policyId },
        });
        if (!existing) {
            throw new appError_1.AppError("Policy not found", 404);
        }
        return db_1.default.companyPolicy.delete({
            where: { id: policyId },
        });
    }
    async getPolicyById(policyId, userId) {
        const policy = await db_1.default.companyPolicy.findUnique({
            where: { id: policyId },
            include: {
                signatures: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                                department: true,
                                user: {
                                    select: {
                                        email: true,
                                        avatar: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!policy) {
            throw new appError_1.AppError("Policy not found", 404);
        }
        let isSigned = false;
        let signedAt = null;
        let signedVersion = null;
        if (userId) {
            const employee = await db_1.default.employee.findFirst({
                where: {
                    OR: [{ userId }, { id: userId }],
                },
            });
            if (employee) {
                const userSignature = policy.signatures.find((s) => s.employeeId === employee.id);
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
    async getAllPolicies(userId, role, search) {
        const where = { parentId: null };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ];
        }
        let employee = await db_1.default.employee.findFirst({
            where: {
                OR: [{ userId }, { id: userId }],
            },
        });
        if (!employee && (role === "SUPER_ADMIN" || role === "HR_ADMIN")) {
            const user = await db_1.default.user.findUnique({ where: { id: userId } });
            if (user) {
                employee = await db_1.default.employee.create({
                    data: {
                        userId: user.id,
                        firstName: user.firstName || user.email.split("@")[0] || "Admin",
                        lastName: user.lastName || "User",
                        status: "NEW",
                    },
                });
            }
        }
        const isAdmin = role === "SUPER_ADMIN" || role === "HR_ADMIN";
        const [policies, totalEmployees] = await Promise.all([
            db_1.default.companyPolicy.findMany({
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
                                    avatar: true,
                                    department: true,
                                    user: {
                                        select: {
                                            email: true,
                                            avatar: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            db_1.default.employee.count({
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
            const upToDateSignatures = policy.signatures.filter((s) => s.signedVersion === policy.version);
            const signedCount = upToDateSignatures.length;
            const signedPercentage = totalEmployees > 0
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
                            firstName: s.employee.firstName,
                            lastName: s.employee.lastName,
                            avatar: s.employee.avatar || s.employee.user?.avatar || null,
                            email: s.employee.user?.email || "",
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
    async signPolicy(userId, policyId) {
        let employee = await db_1.default.employee.findFirst({
            where: {
                OR: [{ userId }, { id: userId }],
            },
        });
        if (!employee) {
            const user = await db_1.default.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new appError_1.AppError("Foydalanuvchi topilmadi", 404);
            }
            employee = await db_1.default.employee.create({
                data: {
                    userId: user.id,
                    firstName: user.firstName || user.email.split("@")[0] || "Foydalanuvchi",
                    lastName: user.lastName || "",
                    status: "NEW",
                },
            });
        }
        const policy = await db_1.default.companyPolicy.findUnique({
            where: { id: policyId },
        });
        if (!policy) {
            throw new appError_1.AppError("Nizom topilmadi", 404);
        }
        return db_1.default.policySignature.upsert({
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
exports.PolicyService = PolicyService;
exports.policyService = new PolicyService();

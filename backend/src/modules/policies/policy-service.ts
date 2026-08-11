import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class PolicyService {
    async createPolicy(payload: {
        title: string;
        description?: string;
        content?: string;
        documentUrl: string;
        isRequired?: boolean;
        parentId?: string;
    }) {
        return prisma.companyPolicy.create({
            data: payload,
        });
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
    ) {
        const existing = await prisma.companyPolicy.findUnique({
            where: { id: policyId },
        });

        if (!existing) {
            throw new AppError("Policy not found", 404);
        }

        return prisma.companyPolicy.update({
            where: { id: policyId },
            data: {
                ...payload,
                version: existing.version + 1,
            },
        });
    }

    async getAllPolicies(userId: string, search?: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        const where: any = { parentId: null };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ];
        }

        const policies = await prisma.companyPolicy.findMany({
            where,
            include: {
                children: true,
                signatures: {
                    where: { employeeId: employee.id },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return policies.map((policy) => {
            const signature = policy.signatures[0];
            return {
                ...policy,
                isSigned: Boolean(signature),
                signedVersion: signature?.signedVersion || null,
                signedAt: signature?.signedAt || null,
                isUpToDateSigned: signature
                    ? signature.signedVersion === policy.version
                    : false,
            };
        });
    }

    async signPolicy(userId: string, policyId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        const policy = await prisma.companyPolicy.findUnique({
            where: { id: policyId },
        });

        if (!policy) {
            throw new AppError("Policy not found", 404);
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

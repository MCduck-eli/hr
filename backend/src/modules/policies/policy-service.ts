import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class PolicyService {
    async createPolicy(payload: {
        title: string;
        description?: string;
        documentUrl: string;
        isRequired?: boolean;
    }) {
        return prisma.companyPolicy.create({
            data: payload,
        });
    }

    async getAllPolicies(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        const policies = await prisma.companyPolicy.findMany({
            include: {
                signatures: {
                    where: { employeeId: employee.id },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return policies.map((policy) => ({
            ...policy,
            isSigned: policy.signatures.length > 0,
            signedAt: policy.signatures[0]?.signedAt || null,
        }));
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
                signedAt: new Date(),
            },
            create: {
                policyId,
                employeeId: employee.id,
            },
        });
    }
}

export const policyService = new PolicyService();

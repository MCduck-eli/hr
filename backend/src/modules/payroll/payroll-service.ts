import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { PayrollStatus } from "@prisma/client";

export class PayrollService {
    async createPayroll(payload: {
        employeeId: string;
        month: number;
        year: number;
        baseSalary: number;
        bonus?: number;
        deductions?: number;
    }) {
        const bonus = payload.bonus || 0;
        const deductions = payload.deductions || 0;
        const netSalary = payload.baseSalary + bonus - deductions;

        const existing = await prisma.payroll.findUnique({
            where: {
                employeeId_month_year: {
                    employeeId: payload.employeeId,
                    month: payload.month,
                    year: payload.year,
                },
            },
        });

        if (existing) {
            throw new AppError(
                "Payroll already generated for this month and year",
                400,
            );
        }

        return prisma.payroll.create({
            data: {
                employeeId: payload.employeeId,
                month: payload.month,
                year: payload.year,
                baseSalary: payload.baseSalary,
                bonus,
                deductions,
                netSalary,
                status: PayrollStatus.PENDING,
            },
        });
    }

    async getMyPayrolls(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        return prisma.payroll.findMany({
            where: { employeeId: employee.id },
            orderBy: [{ year: "desc" }, { month: "desc" }],
        });
    }

    async getAllPayrolls(query: {
        month?: number;
        year?: number;
        status?: PayrollStatus;
    }) {
        const where: any = {};

        if (query.month) where.month = Number(query.month);
        if (query.year) where.year = Number(query.year);
        if (query.status) where.status = query.status;

        return prisma.payroll.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                    },
                },
            },
            orderBy: [{ year: "desc" }, { month: "desc" }],
        });
    }

    async updateStatus(id: string, status: PayrollStatus) {
        const payroll = await prisma.payroll.findUnique({
            where: { id },
        });

        if (!payroll) {
            throw new AppError("Payroll record not found", 404);
        }

        return prisma.payroll.update({
            where: { id },
            data: { status },
        });
    }
}

export const payrollService = new PayrollService();

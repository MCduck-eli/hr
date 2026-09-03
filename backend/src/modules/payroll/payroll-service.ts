import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { PayrollStatus } from "@prisma/client";

export class PayrollService {
    async calculateAutoPayroll(payload: {
        month: number;
        year: number;
        employeeId?: string;
    }, currentUser?: any) {
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

        const employeeWhere: any = {};
        if (payload.employeeId) {
            employeeWhere.id = payload.employeeId;
        }
        if (companyFilter) {
            employeeWhere.user = { companyName: companyFilter };
        }

        const employees = await prisma.employee.findMany({
            where: employeeWhere,
            include: {
                department: true,
                position: true,
                user: { select: { email: true, companyName: true } },
                objectives: {
                    include: {
                        keyResults: true,
                    },
                },
            },
        });

        if (employees.length === 0) {
            return [];
        }

        const startDate = new Date(payload.year, payload.month - 1, 1);
        const endDate = new Date(payload.year, payload.month, 0, 23, 59, 59);

        const workingDays = 22;

        const results = await Promise.all(
            employees.map(async (emp) => {
                const baseSalary = emp.salary && emp.salary > 0 ? emp.salary : 5000000;

                const attendances = await prisma.attendance.findMany({
                    where: {
                        employeeId: emp.id,
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                });

                const attendedDays = attendances.filter((a) => a.checkIn).length;

                let lateDays = 0;
                attendances.forEach((a) => {
                    if (a.checkIn) {
                        const d = new Date(a.checkIn);
                        const minutes = d.getHours() * 60 + d.getMinutes();
                        if (minutes > 9 * 60 + 15) {
                            lateDays++;
                        }
                    }
                });

                const absentDays = Math.max(0, workingDays - attendedDays);
                const absentDeduction = absentDays > 0 ? Math.round((baseSalary / workingDays) * absentDays * 0.7) : 0;
                const latePenalty = lateDays * 50000;
                const attendanceDeduction = Math.min(Math.round(baseSalary * 0.5), absentDeduction + latePenalty);

                let okrAvgProgress = 0;
                if (emp.objectives && emp.objectives.length > 0) {
                    let totalProgress = 0;
                    let count = 0;
                    emp.objectives.forEach((obj) => {
                        if (obj.keyResults && obj.keyResults.length > 0) {
                            obj.keyResults.forEach((kr) => {
                                const target = kr.targetValue || 100;
                                const current = kr.currentValue || 0;
                                const prog = Math.min(100, Math.round((current / target) * 100));
                                totalProgress += prog;
                                count++;
                            });
                        }
                    });
                    okrAvgProgress = count > 0 ? Math.round(totalProgress / count) : 0;
                }

                let okrBonus = 0;
                if (okrAvgProgress >= 90) {
                    okrBonus = Math.round(baseSalary * 0.2);
                } else if (okrAvgProgress >= 75) {
                    okrBonus = Math.round(baseSalary * 0.1);
                } else if (okrAvgProgress >= 60) {
                    okrBonus = Math.round(baseSalary * 0.05);
                }

                const totalBonus = okrBonus;
                const totalDeductions = attendanceDeduction;
                const netSalary = Math.max(0, baseSalary + totalBonus - totalDeductions);

                const existingPayroll = await prisma.payroll.findUnique({
                    where: {
                        employeeId_month_year: {
                            employeeId: emp.id,
                            month: payload.month,
                            year: payload.year,
                        },
                    },
                });

                return {
                    employeeId: emp.id,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    department: emp.department?.name || "Bo'limsiz",
                    position: emp.position?.title || "Lavozimsiz",
                    companyName: emp.user?.companyName || null,
                    month: payload.month,
                    year: payload.year,
                    baseSalary,
                    attendanceStats: {
                        workingDays,
                        attendedDays,
                        lateDays,
                        absentDays,
                        absentDeduction,
                        latePenalty,
                        totalAttendanceDeduction: attendanceDeduction,
                    },
                    okrStats: {
                        totalObjectives: emp.objectives?.length || 0,
                        averageProgress: okrAvgProgress,
                        okrBonus,
                    },
                    bonus: totalBonus,
                    deductions: totalDeductions,
                    netSalary,
                    status: existingPayroll?.status || PayrollStatus.PENDING,
                    payrollId: existingPayroll?.id || null,
                };
            }),
        );

        return results;
    }

    async generateBatchPayroll(payload: {
        month: number;
        year: number;
    }, currentUser?: any) {
        const calculated = await this.calculateAutoPayroll(payload, currentUser);

        const createdOrUpdated = await Promise.all(
            calculated.map(async (item) => {
                return prisma.payroll.upsert({
                    where: {
                        employeeId_month_year: {
                            employeeId: item.employeeId,
                            month: payload.month,
                            year: payload.year,
                        },
                    },
                    update: {
                        baseSalary: item.baseSalary,
                        bonus: item.bonus,
                        deductions: item.deductions,
                        netSalary: item.netSalary,
                    },
                    create: {
                        employeeId: item.employeeId,
                        month: payload.month,
                        year: payload.year,
                        baseSalary: item.baseSalary,
                        bonus: item.bonus,
                        deductions: item.deductions,
                        netSalary: item.netSalary,
                        status: PayrollStatus.PENDING,
                    },
                });
            }),
        );

        return createdOrUpdated;
    }

    async createPayroll(payload: {
        employeeId: string;
        month: number;
        year: number;
        baseSalary: number;
        bonus?: number;
        deductions?: number;
    }, currentUser?: any) {
        const bonus = payload.bonus || 0;
        const deductions = payload.deductions || 0;
        const netSalary = Math.max(0, payload.baseSalary + bonus - deductions);

        const employee = await prisma.employee.findUnique({
            where: { id: payload.employeeId },
            include: { user: { select: { companyName: true } } },
        });

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        if (
            currentUser?.companyName &&
            employee.user?.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            employee.user.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

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
            return prisma.payroll.update({
                where: { id: existing.id },
                data: {
                    baseSalary: payload.baseSalary,
                    bonus,
                    deductions,
                    netSalary,
                },
            });
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
            include: {
                department: true,
                position: true,
                user: { select: { companyName: true } },
            },
        });

        if (!employee) {
            throw new AppError("Xodim profili topilmadi", 404);
        }

        const payrolls = await prisma.payroll.findMany({
            where: { employeeId: employee.id },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                    },
                },
            },
            orderBy: [{ year: "desc" }, { month: "desc" }],
        });

        return payrolls;
    }

    async getAllPayrolls(query: {
        month?: number;
        year?: number;
        status?: PayrollStatus;
        search?: string;
    }, currentUser?: any) {
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

        const where: any = {};

        if (query.month) where.month = Number(query.month);
        if (query.year) where.year = Number(query.year);
        if (query.status) where.status = query.status;

        if (companyFilter) {
            where.employee = {
                user: { companyName: companyFilter },
            };
        }

        if (query.search) {
            where.employee = {
                ...where.employee,
                OR: [
                    { firstName: { contains: query.search, mode: "insensitive" } },
                    { lastName: { contains: query.search, mode: "insensitive" } },
                ],
            };
        }

        const payrolls = await prisma.payroll.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        salary: true,
                        department: { select: { id: true, name: true } },
                        position: { select: { id: true, title: true } },
                        user: { select: { email: true, companyName: true } },
                    },
                },
            },
            orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
        });

        return payrolls;
    }

    async updateStatus(id: string, status: PayrollStatus, currentUser?: any) {
        const payroll = await prisma.payroll.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        user: { select: { companyName: true } },
                    },
                },
            },
        });

        if (!payroll) {
            throw new AppError("Ish haqi varaqasi topilmadi", 404);
        }

        if (
            currentUser?.companyName &&
            payroll.employee.user?.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            payroll.employee.user.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return prisma.payroll.update({
            where: { id },
            data: { status },
        });
    }

    async deletePayroll(id: string, currentUser?: any) {
        const payroll = await prisma.payroll.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        user: { select: { companyName: true } },
                    },
                },
            },
        });

        if (!payroll) {
            throw new AppError("Ish haqi varaqasi topilmadi", 404);
        }

        if (
            currentUser?.companyName &&
            payroll.employee.user?.companyName &&
            currentUser.role !== "SUPER_ADMIN" &&
            payroll.employee.user.companyName !== currentUser.companyName
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return prisma.payroll.delete({
            where: { id },
        });
    }
}

export const payrollService = new PayrollService();

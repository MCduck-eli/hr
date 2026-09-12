import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { PayrollStatus, Role } from "@prisma/client";
import { notificationService } from "../notification/notification-service";
import { randomUUID } from "crypto";

export class PayrollService {
    async getPenaltyRules(currentUser?: any) {
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

        const rules = await prisma.payrollPenaltyRule.findMany({
            where: {
                companyName: companyFilter,
            },
            orderBy: { createdAt: "asc" },
        });

        if (rules.length === 0) {
            const defaultRules = [
                {
                    name: "Sababsiz ishga kelmaslik",
                    code: "ABSENCE",
                    penaltyType: "PERCENT",
                    amount: 100,
                    isAuto: true,
                    description: "Ishga sababsiz kelmagan har bir kun uchun kunlik ish haqidan 100% ushlab qolinadi",
                    companyName: companyFilter,
                },
                {
                    name: "Kechikish (belgilangan summa)",
                    code: "LATE_FIXED",
                    penaltyType: "FIXED",
                    amount: 50000,
                    isAuto: true,
                    description: "Har bir kechikish holati uchun belgilangan 50 000 UZS jarima",
                    companyName: companyFilter,
                },
                {
                    name: "Kechikish (har bir daqiqa uchun)",
                    code: "LATE_MINUTES",
                    penaltyType: "PER_MINUTE",
                    amount: 1000,
                    isAuto: false,
                    description: "Kechikilgan har bir daqiqa uchun 1 000 UZS",
                    companyName: companyFilter,
                },
                {
                    name: "Ichki tartib-qoidani buzish",
                    code: "VIOLATION",
                    penaltyType: "FIXED",
                    amount: 100000,
                    isAuto: false,
                    description: "Kompaniya ichki qoidalarini yoki kiyinish tartibini buzganlik uchun",
                    companyName: companyFilter,
                },
                {
                    name: "Muddati o'tgan topshiriq",
                    code: "TASK_OVERDUE",
                    penaltyType: "FIXED",
                    amount: 50000,
                    isAuto: false,
                    description: "Belgilangan muhim topshiriq yoki OKR muddatini o'tkazib yuborganlik uchun",
                    companyName: companyFilter,
                },
            ];

            for (const r of defaultRules) {
                const exist = await prisma.payrollPenaltyRule.findFirst({
                    where: {
                        code: r.code,
                        companyName: companyFilter,
                    },
                });
                if (!exist) {
                    await prisma.payrollPenaltyRule.create({
                        data: r,
                    });
                }
            }

            return prisma.payrollPenaltyRule.findMany({
                where: { companyName: companyFilter },
                orderBy: { createdAt: "asc" },
            });
        }

        return rules;
    }

    async createPenaltyRule(payload: {
        name: string;
        code: string;
        penaltyType: string;
        amount: number;
        isAuto?: boolean;
        description?: string;
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

        const existing = await prisma.payrollPenaltyRule.findFirst({
            where: {
                code: payload.code.trim().toUpperCase(),
                companyName: companyFilter,
            },
        });

        if (existing) {
            throw new AppError("Bunday kodli jarima qoidasi mavjud", 400);
        }

        return prisma.payrollPenaltyRule.create({
            data: {
                name: payload.name.trim(),
                code: payload.code.trim().toUpperCase(),
                penaltyType: payload.penaltyType || "FIXED",
                amount: Number(payload.amount) || 0,
                isAuto: Boolean(payload.isAuto),
                description: payload.description?.trim() || null,
                companyName: companyFilter,
            },
        });
    }

    async updatePenaltyRule(id: string, payload: {
        name?: string;
        penaltyType?: string;
        amount?: number;
        isAuto?: boolean;
        description?: string;
    }, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const rule = await prisma.payrollPenaltyRule.findUnique({
            where: { id },
        });

        if (!rule) {
            throw new AppError("Jarima qoidasi topilmadi", 404);
        }

        if (
            callerCompany &&
            rule.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            rule.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return prisma.payrollPenaltyRule.update({
            where: { id },
            data: {
                name: payload.name !== undefined ? payload.name.trim() : undefined,
                penaltyType: payload.penaltyType !== undefined ? payload.penaltyType : undefined,
                amount: payload.amount !== undefined ? Number(payload.amount) : undefined,
                isAuto: payload.isAuto !== undefined ? Boolean(payload.isAuto) : undefined,
                description: payload.description !== undefined ? payload.description?.trim() : undefined,
            },
        });
    }

    async deletePenaltyRule(id: string, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const rule = await prisma.payrollPenaltyRule.findUnique({
            where: { id },
        });

        if (!rule) {
            throw new AppError("Jarima qoidasi topilmadi", 404);
        }

        if (
            callerCompany &&
            rule.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            rule.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return prisma.payrollPenaltyRule.delete({
            where: { id },
        });
    }

    async getEmployeePenalties(query: {
        month?: number;
        year?: number;
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

        const where: any = {};
        if (query.month) where.month = Number(query.month);
        if (query.year) where.year = Number(query.year);
        if (query.employeeId) where.employeeId = query.employeeId;

        if (companyFilter) {
            where.employee = {
                user: { companyName: companyFilter },
            };
        }

        return prisma.employeePenalty.findMany({
            where,
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
                rule: true,
            },
            orderBy: { date: "desc" },
        });
    }

    async getPenaltiesSummary(query: { month?: string | number; year?: string | number }, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const companyFilter = callerRole === "SUPER_ADMIN" ? null : callerCompany;

        const targetMonth = Number(query.month) || (new Date().getMonth() + 1);
        const targetYear = Number(query.year) || new Date().getFullYear();

        const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

        const [penaltyRules, employees, employeePenalties, attendances, approvedLeaves, schedules, payrolls] = await Promise.all([
            prisma.payrollPenaltyRule.findMany({
                where: companyFilter ? { companyName: companyFilter } : {},
            }),
            prisma.employee.findMany({
                where: {
                    user: {
                        role: { notIn: ["SUPER_ADMIN", "DIRECTOR"] },
                        ...(companyFilter ? { companyName: companyFilter } : {}),
                    },
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    salary: true,
                    salaryType: true,
                    hourlyRate: true,
                    taxPercent: true,
                    createdAt: true,
                    departmentId: true,
                    department: { select: { id: true, name: true } },
                    position: { select: { id: true, title: true } },
                    user: { select: { email: true, companyName: true, createdAt: true } },
                },
                orderBy: { firstName: "asc" },
            }),
            prisma.employeePenalty.findMany({
                where: {
                    month: targetMonth,
                    year: targetYear,
                    ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            department: { select: { name: true } },
                            position: { select: { title: true } },
                            user: { select: { email: true } },
                        },
                    },
                    rule: true,
                },
                orderBy: { date: "desc" },
            }),
            prisma.attendance.findMany({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            department: { select: { name: true } },
                            position: { select: { title: true } },
                            user: { select: { email: true } },
                        },
                    },
                },
                orderBy: { date: "desc" },
            }),
            prisma.leaveRequest.findMany({
                where: {
                    status: "APPROVED",
                    startDate: { lte: endDate },
                    endDate: { gte: startDate },
                    ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
                },
            }),
            prisma.workSchedule.findMany(),
            prisma.payroll.findMany({
                where: {
                    month: targetMonth,
                    year: targetYear,
                    ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
                },
            }),
        ]);

        const defaultSchedule = schedules.find((s) => s.isDefault) || {
            id: "default",
            name: "Standart Ish Jadvali",
            startTime: "09:00",
            endTime: "18:00",
            workingDays: [1, 2, 3, 4, 5],
            gracePeriodMinutes: 15,
        };

        const absenceRule = penaltyRules.find((r) => r.code === "ABSENCE" && r.isAuto);
        const lateFixedRule = penaltyRules.find((r) => r.code === "LATE_FIXED" && r.isAuto);
        const lateMinuteRule = penaltyRules.find((r) => r.code === "LATE_MINUTES" && r.isAuto);

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const isFutureMonth = targetYear > currentYear || (targetYear === currentYear && targetMonth > currentMonth);
        const isCurrentMonth = targetYear === currentYear && targetMonth === currentMonth;

        const lateAttendances = attendances
            .filter((a) => {
                const lateMin = a.lateMinutes || 0;
                let isLateByCheckIn = false;
                if (a.checkIn) {
                    const d = new Date(a.checkIn);
                    const minutes = d.getHours() * 60 + d.getMinutes();
                    if (minutes > 9 * 60 + 15) {
                        isLateByCheckIn = true;
                    }
                }
                return lateMin > 0 || isLateByCheckIn || a.status === "LATE";
            })
            .map((a) => {
                let effectiveLateMinutes = a.lateMinutes || 0;
                if (effectiveLateMinutes === 0 && a.checkIn) {
                    const d = new Date(a.checkIn);
                    const minutes = d.getHours() * 60 + d.getMinutes();
                    if (minutes > 9 * 60) {
                        effectiveLateMinutes = Math.max(0, minutes - 9 * 60);
                    }
                }

                let fineAmount = 0;
                if (lateFixedRule) {
                    fineAmount = lateFixedRule.amount;
                } else if (lateMinuteRule && effectiveLateMinutes > 0) {
                    fineAmount = effectiveLateMinutes * lateMinuteRule.amount;
                } else if (effectiveLateMinutes > 0) {
                    fineAmount = Math.max(10000, effectiveLateMinutes * 2000);
                }

                return {
                    id: a.id,
                    employeeId: a.employeeId,
                    employee: a.employee,
                    date: a.date,
                    checkIn: a.checkIn,
                    checkOut: a.checkOut,
                    lateMinutes: effectiveLateMinutes,
                    status: a.status,
                    fineAmount,
                };
            });

        
        try {
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - 3);
            cutoffDate.setHours(0, 0, 0, 0);

            await prisma.employeePenalty.deleteMany({
                where: {
                    createdAt: { lt: cutoffDate },
                    ...(companyFilter ? { companyName: companyFilter } : {}),
                },
            });
        } catch (cleanupErr) {
            console.warn("Auto-cleanup old penalties error:", cleanupErr);
        }

        const employeeSummaries = employees.map((emp) => {
            let attendedDays = 0;
            let absentDays = 0;
            const baseSalary = emp.salary && emp.salary > 0 ? emp.salary : 5000000;

            const empPayroll = payrolls.find((p) => p.employeeId === emp.id);
            const isSalaryPaid = empPayroll?.status === PayrollStatus.PAID;
            const cutoffDay = isSalaryPaid ? 5 : 0;

            const empSchedule =
                schedules.find((s) => s.employeeId === emp.id) ||
                (emp.departmentId ? schedules.find((s) => s.departmentId === emp.departmentId) : null) ||
                defaultSchedule;

            const workingDaysArr = empSchedule.workingDays || [1, 2, 3, 4, 5];

            let workingDaysInMonth = 0;
            const curIter = new Date(startDate);
            while (curIter <= endDate) {
                const dow = curIter.getDay() === 0 ? 7 : curIter.getDay();
                if (workingDaysArr.includes(dow)) {
                    workingDaysInMonth++;
                }
                curIter.setDate(curIter.getDate() + 1);
            }
            if (workingDaysInMonth === 0) workingDaysInMonth = 22;

            const empCreatedAtRaw = emp.createdAt || emp.user?.createdAt || startDate;
            const empCreatedAt = new Date(empCreatedAtRaw);
            empCreatedAt.setHours(0, 0, 0, 0);

            const baselineStart = isSalaryPaid
                ? new Date(targetYear, targetMonth - 1, cutoffDay + 1, 0, 0, 0, 0)
                : startDate;

            const evalStartDate = empCreatedAt > baselineStart ? empCreatedAt : baselineStart;
            const evalEndDate = isCurrentMonth
                ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
                : endDate;

            const empAttendances = attendances.filter((a) => a.employeeId === emp.id);
            const empLeaves = approvedLeaves.filter((l) => l.employeeId === emp.id);

            const empAbsentRecords: {
                id: string;
                employeeId: string;
                employee: any;
                date: string;
                reason: string;
                fineAmount: number;
            }[] = [];

            if (!isFutureMonth && evalStartDate <= evalEndDate) {
                const curDay = new Date(evalStartDate);
                while (curDay <= evalEndDate) {
                    const dow = curDay.getDay() === 0 ? 7 : curDay.getDay();
                    if (workingDaysArr.includes(dow)) {
                        const curDayStr = curDay.toISOString().split("T")[0];
                        const isToday = curDay.toDateString() === now.toDateString();

                        const att = empAttendances.find((a) => {
                            const attStr = a.date ? new Date(a.date).toISOString().split("T")[0] : "";
                            return attStr === curDayStr;
                        });

                        const onLeave = empLeaves.some((l) => {
                            const sStr = new Date(l.startDate).toISOString().split("T")[0];
                            const eStr = new Date(l.endDate).toISOString().split("T")[0];
                            return curDayStr >= sStr && curDayStr <= eStr;
                        });

                        if (att?.checkIn || att?.status === "PRESENT" || att?.status === "LATE" || att?.status === "HALF_DAY") {
                            attendedDays++;
                        } else if (onLeave || att?.absenceReason || att?.status === "ON_LEAVE") {
                        } else if (!isToday) {
                            absentDays++;
                            if (emp.salaryType !== "HOURLY") {
                                let singleDayFine = 0;
                                if (absenceRule) {
                                    if (absenceRule.penaltyType === "PERCENT") {
                                        singleDayFine = Math.round((baseSalary / workingDaysInMonth) * (absenceRule.amount / 100));
                                    } else {
                                        singleDayFine = Math.round(absenceRule.amount);
                                    }
                                } else {
                                    singleDayFine = Math.round(baseSalary / workingDaysInMonth);
                                }

                                empAbsentRecords.push({
                                    id: `absent-${emp.id}-${curDayStr}`,
                                    employeeId: emp.id,
                                    employee: {
                                        id: emp.id,
                                        firstName: emp.firstName,
                                        lastName: emp.lastName,
                                        department: emp.department,
                                        position: emp.position,
                                        email: emp.user?.email || "",
                                        user: { email: emp.user?.email || "" },
                                    },
                                    date: curDayStr,
                                    reason: "Ishga sababsiz kelmaganlik",
                                    fineAmount: singleDayFine,
                                });
                            }
                        }
                    }
                    curDay.setDate(curDay.getDate() + 1);
                }
            }

            const absentFines = empAbsentRecords.reduce((sum, r) => sum + r.fineAmount, 0);

            const empLates = lateAttendances.filter((l) => {
                if (l.employeeId !== emp.id) return false;
                const lDate = new Date(l.date);
                const lMonth = lDate.getMonth() + 1;
                const lYear = lDate.getFullYear();
                const lDay = lDate.getDate();

                if (lMonth !== targetMonth || lYear !== targetYear) return false;
                if (isSalaryPaid && lDay <= cutoffDay) return false;
                return true;
            });
            const totalLateMinutes = empLates.reduce((sum, l) => sum + (l.lateMinutes || 0), 0);
            const totalLateFines = empLates.reduce((sum, l) => sum + (l.fineAmount || 0), 0);

            const empPenalties = employeePenalties.filter((p) => {
                if (p.employeeId !== emp.id) return false;
                const pDate = new Date(p.date || p.createdAt);
                const pMonth = p.month || (pDate.getMonth() + 1);
                const pYear = p.year || pDate.getFullYear();
                const pDay = pDate.getDate();

                if (pMonth !== targetMonth || pYear !== targetYear) return false;
                if (isSalaryPaid && pDay <= cutoffDay) return false;
                return true;
            });
            const totalDisciplinaryFines = empPenalties.reduce((sum, p) => sum + (p.amount || 0), 0);

            return {
                employeeId: emp.id,
                firstName: emp.firstName,
                lastName: emp.lastName,
                name: `${emp.firstName} ${emp.lastName}`.trim(),
                email: emp.user?.email || "",
                department: emp.department?.name || "-",
                position: emp.position?.title || "-",
                isSalaryPaid,
                attendedDays,
                absentDays,
                absentFines,
                absentRecords: empAbsentRecords,
                lateCount: empLates.length,
                totalLateMinutes,
                totalLateFines,
                disciplinaryCount: empPenalties.length,
                totalDisciplinaryFines,
                totalFines: totalLateFines + absentFines + totalDisciplinaryFines,
                disciplinaryPenalties: empPenalties,
                lateAttendances: empLates,
            };
        });

        const allAbsentRecords = employeeSummaries.flatMap((e) => e.absentRecords || []);
        const allActiveLates = employeeSummaries.flatMap((e) => e.lateAttendances || []);
        const allActiveDisciplinary = employeeSummaries.flatMap((e) => e.disciplinaryPenalties || []);
        const totalLateFines = allActiveLates.reduce((sum, l) => sum + (l.fineAmount || 0), 0);
        const totalDisciplinaryFines = allActiveDisciplinary.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalLateMinutes = allActiveLates.reduce((sum, l) => sum + (l.lateMinutes || 0), 0);
        const totalAbsentDays = employeeSummaries.reduce((sum, e) => sum + e.absentDays, 0);
        const totalAbsentFines = employeeSummaries.reduce((sum, e) => sum + e.absentFines, 0);
        const grandTotalFines = totalLateFines + totalAbsentFines + totalDisciplinaryFines;

        
        const archiveStart = new Date(targetYear, targetMonth - 4, 1, 0, 0, 0, 0);
        const archiveEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

        const [threeMonthPenalties, threeMonthAttendances] = await Promise.all([
            prisma.employeePenalty.findMany({
                where: {
                    createdAt: { gte: archiveStart, lte: archiveEnd },
                    ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            department: { select: { name: true } },
                            position: { select: { title: true } },
                            user: { select: { email: true } },
                        },
                    },
                    rule: true,
                },
                orderBy: { date: "desc" },
            }),
            prisma.attendance.findMany({
                where: {
                    date: { gte: archiveStart, lte: archiveEnd },
                    lateMinutes: { gt: 0 },
                    ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            department: { select: { name: true } },
                            position: { select: { title: true } },
                            user: { select: { email: true } },
                        },
                    },
                },
                orderBy: { date: "desc" },
            }),
        ]);

        return {
            month: targetMonth,
            year: targetYear,
            lateAttendances: allActiveLates,
            absentRecords: allAbsentRecords,
            disciplinaryPenalties: allActiveDisciplinary,
            employeeSummaries,
            penaltyRules,
            stats: {
                totalLateCount: allActiveLates.length,
                totalLateMinutes,
                totalLateFines,
                totalAbsentDays,
                totalAbsentFines,
                totalDisciplinaryCount: allActiveDisciplinary.length,
                totalDisciplinaryFines,
                grandTotalFines,
                totalPenalizedEmployees: employeeSummaries.filter((e) => e.totalFines > 0).length,
                totalActiveRules: penaltyRules.length,
            },
            archive: {
                threeMonthPenalties,
                threeMonthAttendances: threeMonthAttendances.map((a) => {
                    let fine = 0;
                    if (lateFixedRule) {
                        fine = lateFixedRule.amount;
                    } else if (lateMinuteRule) {
                        fine = (a.lateMinutes || 0) * lateMinuteRule.amount;
                    } else {
                        fine = Math.max(10000, (a.lateMinutes || 0) * 2000);
                    }
                    return {
                        id: a.id,
                        employeeId: a.employeeId,
                        employee: a.employee,
                        date: a.date,
                        checkIn: a.checkIn,
                        lateMinutes: a.lateMinutes,
                        fineAmount: fine,
                    };
                }),
            },
        };
    }

    async createEmployeePenalty(payload: {
        employeeId: string;
        ruleId?: string;
        reason: string;
        amount: number;
        month: number;
        year: number;
        date?: string;
    }, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const employee = await prisma.employee.findUnique({
            where: { id: payload.employeeId },
            include: { user: { select: { companyName: true, role: true } } },
        });

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        if (
            callerCompany &&
            employee.user?.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            employee.user.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const companyName = callerCompany || employee.user?.companyName || null;
        const penaltyDate = payload.date && !isNaN(new Date(payload.date).getTime()) ? new Date(payload.date) : new Date();
        const penaltyAmount = Number(payload.amount) || 0;
        const targetMonth = Number(payload.month);
        const targetYear = Number(payload.year);

        const penalty = await prisma.employeePenalty.create({
            data: {
                employeeId: payload.employeeId,
                ruleId: payload.ruleId && payload.ruleId.trim() !== "" ? payload.ruleId : null,
                reason: payload.reason.trim(),
                amount: penaltyAmount,
                month: targetMonth,
                year: targetYear,
                date: penaltyDate,
                isAuto: false,
                companyName,
            },
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
                rule: true,
            },
        });

        await this.syncPayrollDeductionsAndNet(payload.employeeId, targetMonth, targetYear);

        return penalty;
    }

    async deleteEmployeePenalty(id: string, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const penalty = await prisma.employeePenalty.findUnique({
            where: { id },
            include: { employee: { include: { user: { select: { companyName: true } } } } },
        });

        if (!penalty) {
            throw new AppError("Jarima yozuvi topilmadi", 404);
        }

        if (
            callerCompany &&
            penalty.employee?.user?.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            penalty.employee.user.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const deleted = await prisma.employeePenalty.delete({
            where: { id },
        });

        await this.syncPayrollDeductionsAndNet(penalty.employeeId, penalty.month, penalty.year);

        return deleted;
    }

    async updateEmployeePenalty(id: string, payload: { reason?: string; amount?: number; ruleId?: string; date?: string }, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const penalty = await prisma.employeePenalty.findUnique({
            where: { id },
            include: { employee: { include: { user: { select: { companyName: true } } } } },
        });

        if (!penalty) {
            throw new AppError("Jarima yozuvi topilmadi", 404);
        }

        if (
            callerCompany &&
            penalty.employee?.user?.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            penalty.employee.user.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const updated = await prisma.employeePenalty.update({
            where: { id },
            data: {
                ...(payload.reason ? { reason: payload.reason.trim() } : {}),
                ...(payload.amount !== undefined ? { amount: Number(payload.amount) || 0 } : {}),
                ...(payload.ruleId !== undefined ? { ruleId: payload.ruleId || null } : {}),
                ...(payload.date ? { date: new Date(payload.date) } : {}),
            },
        });

        await this.syncPayrollDeductionsAndNet(penalty.employeeId, penalty.month, penalty.year);

        return updated;
    }

    async waivePenalty(payload: {
        type: "ABSENCE" | "LATENESS" | "DISCIPLINARY";
        id?: string;
        employeeId: string;
        date: string;
        reason?: string;
    }, currentUser?: any) {
        const { type, id, employeeId, date, reason } = payload;
        const waiveReason = reason || "HR Admin tomonidan bekor qilingan / uzrli";
        const targetDate = new Date(date);
        const targetMonth = targetDate.getMonth() + 1;
        const targetYear = targetDate.getFullYear();

        if (type === "DISCIPLINARY" && id) {
            await this.deleteEmployeePenalty(id, currentUser);
            return { success: true, message: "Intizomiy jarima bekor qilindi" };
        }

        if (type === "LATENESS") {
            if (id && !id.startsWith("arch-late-")) {
                await prisma.attendance.updateMany({
                    where: { id },
                    data: {
                        lateMinutes: 0,
                        status: "PRESENT",
                        absenceReason: waiveReason,
                    },
                });
            } else {
                const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
                const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
                await prisma.attendance.updateMany({
                    where: {
                        employeeId,
                        date: { gte: dayStart, lte: dayEnd },
                    },
                    data: {
                        lateMinutes: 0,
                        status: "PRESENT",
                        absenceReason: waiveReason,
                    },
                });
            }
            await this.syncPayrollDeductionsAndNet(employeeId, targetMonth, targetYear);
            return { success: true, message: "Kechikish jarimasi bekor qilindi" };
        }

        if (type === "ABSENCE") {
            const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
            const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

            const existing = await prisma.attendance.findFirst({
                where: {
                    employeeId,
                    date: { gte: dayStart, lte: dayEnd },
                },
            });

            if (existing) {
                await prisma.attendance.update({
                    where: { id: existing.id },
                    data: {
                        absenceReason: waiveReason,
                        status: "ON_LEAVE",
                    },
                });
            } else {
                await prisma.attendance.create({
                    data: {
                        employeeId,
                        date: targetDate,
                        status: "ON_LEAVE",
                        absenceReason: waiveReason,
                    },
                });
            }

            await this.syncPayrollDeductionsAndNet(employeeId, targetMonth, targetYear);
            return { success: true, message: "Ishga kelmaganlik jarimasi bekor qilindi" };
        }

        return { success: true };
    }

    async editPenalty(payload: {
        type: "ABSENCE" | "LATENESS" | "DISCIPLINARY";
        id?: string;
        employeeId: string;
        date: string;
        amount: number;
        reason?: string;
        month?: number;
        year?: number;
    }, currentUser?: any) {
        const { type, id, employeeId, date, amount, reason } = payload;
        const targetDate = new Date(date);
        const targetMonth = payload.month || targetDate.getMonth() + 1;
        const targetYear = payload.year || targetDate.getFullYear();

        if (type === "DISCIPLINARY" && id) {
            return this.updateEmployeePenalty(id, { amount: Number(amount) || 0, reason }, currentUser);
        }

        const newPenalty = await prisma.employeePenalty.create({
            data: {
                employeeId,
                reason: reason || (type === "ABSENCE" ? "Ishga kelmaganlik (Tahrirlangan)" : "Kechikish (Tahrirlangan)"),
                amount: Number(amount) || 0,
                month: targetMonth,
                year: targetYear,
                date: targetDate,
            },
        });

        if (type === "ABSENCE") {
            const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
            const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
            const existing = await prisma.attendance.findFirst({
                where: { employeeId, date: { gte: dayStart, lte: dayEnd } },
            });
            if (existing) {
                await prisma.attendance.update({
                    where: { id: existing.id },
                    data: { status: "ON_LEAVE", absenceReason: "Qo'lda tahrirlangan jarima" },
                });
            } else {
                await prisma.attendance.create({
                    data: { employeeId, date: targetDate, status: "ON_LEAVE", absenceReason: "Qo'lda tahrirlangan jarima" },
                });
            }
        }

        await this.syncPayrollDeductionsAndNet(employeeId, targetMonth, targetYear);
        return newPenalty;
    }

    async getPayrollSchedule(currentUser?: any) {
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

        let schedule = await prisma.payrollSchedule.findFirst({
            where: { companyName: companyFilter },
        });

        if (!schedule) {
            schedule = await prisma.payrollSchedule.create({
                data: {
                    companyName: companyFilter,
                    salaryPayDay: 5,
                    advancePayDay: 20,
                    advancePercentage: 40,
                    isAdvanceEnabled: true,
                    notificationLeadDays: 2,
                },
            });
        }

        return schedule;
    }

    async updatePayrollSchedule(payload: {
        salaryPayDay?: number;
        advancePayDay?: number;
        advancePercentage?: number;
        isAdvanceEnabled?: boolean;
        notificationLeadDays?: number;
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

        const existing = await prisma.payrollSchedule.findFirst({
            where: { companyName: companyFilter },
        });

        if (existing) {
            return prisma.payrollSchedule.update({
                where: { id: existing.id },
                data: {
                    salaryPayDay: payload.salaryPayDay !== undefined ? Number(payload.salaryPayDay) : undefined,
                    advancePayDay: payload.advancePayDay !== undefined ? Number(payload.advancePayDay) : undefined,
                    advancePercentage: payload.advancePercentage !== undefined ? Number(payload.advancePercentage) : undefined,
                    isAdvanceEnabled: payload.isAdvanceEnabled !== undefined ? Boolean(payload.isAdvanceEnabled) : undefined,
                    notificationLeadDays: payload.notificationLeadDays !== undefined ? Number(payload.notificationLeadDays) : undefined,
                },
            });
        }

        return prisma.payrollSchedule.create({
            data: {
                companyName: companyFilter,
                salaryPayDay: payload.salaryPayDay !== undefined ? Number(payload.salaryPayDay) : 5,
                advancePayDay: payload.advancePayDay !== undefined ? Number(payload.advancePayDay) : 20,
                advancePercentage: payload.advancePercentage !== undefined ? Number(payload.advancePercentage) : 40,
                isAdvanceEnabled: payload.isAdvanceEnabled !== undefined ? Boolean(payload.isAdvanceEnabled) : true,
                notificationLeadDays: payload.notificationLeadDays !== undefined ? Number(payload.notificationLeadDays) : 2,
            },
        });
    }

    async getAdvances(query: {
        month?: number;
        year?: number;
        employeeId?: string;
        status?: PayrollStatus;
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
        if (query.employeeId) where.employeeId = query.employeeId;
        if (query.status) where.status = query.status;

        if (companyFilter) {
            where.employee = {
                user: { companyName: companyFilter },
            };
        }

        return prisma.payrollAdvance.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        salary: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                        user: { select: { email: true } },
                    },
                },
            },
            orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
        });
    }

    async createAdvance(payload: {
        employeeId: string;
        amount: number;
        month: number;
        year: number;
        dueDate?: string;
        isEarly?: boolean;
        reason?: string;
    }, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const employee = await prisma.employee.findUnique({
            where: { id: payload.employeeId },
            include: { user: { select: { id: true, companyName: true, role: true } } },
        });

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        if (
            callerCompany &&
            employee.user?.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            employee.user.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const companyName = callerCompany || employee.user?.companyName || null;
        const targetMonth = Number(payload.month);
        const targetYear = Number(payload.year);
        const amount = Number(payload.amount);
        const baseSalary = employee.salary && employee.salary > 0 ? employee.salary : 5000000;

        
        const daysInMonthCount = new Date(targetYear, targetMonth, 0).getDate();
        let workingDaysInMonth = 0;
        let passedWorkingDays = 0;
        const now = new Date();
        const isTargetCurrentMonth = targetYear === now.getFullYear() && targetMonth === (now.getMonth() + 1);

        
        const existingPayroll = await prisma.payroll.findUnique({
            where: {
                employeeId_month_year: {
                    employeeId: payload.employeeId,
                    month: targetMonth,
                    year: targetYear,
                },
            },
        });

        const isSalaryPaid = existingPayroll?.status === PayrollStatus.PAID;
        const salaryPaidDate = existingPayroll?.confirmedAt || existingPayroll?.disbursedAt || null;
        const salaryPaidTime = salaryPaidDate ? new Date(salaryPaidDate).getTime() : 0;
        let cutoffDay = 5;

        const startFromDay = isSalaryPaid && targetMonth === (now.getMonth() + 1) && targetYear === now.getFullYear()
            ? cutoffDay + 1
            : 1;

        const isWorkDayEnded = now.getHours() >= 18;

        for (let d = 1; d <= daysInMonthCount; d++) {
            const checkDate = new Date(targetYear, targetMonth - 1, d);
            const dow = checkDate.getDay();
            if (dow !== 0 && dow !== 6) {
                workingDaysInMonth++;
                if (d >= startFromDay) {
                    if (isTargetCurrentMonth) {
                        if (d < now.getDate()) {
                            passedWorkingDays++;
                        } else if (d === now.getDate() && isWorkDayEnded) {
                            passedWorkingDays++;
                        }
                    } else if (targetYear < now.getFullYear() || (targetYear === now.getFullYear() && targetMonth < (now.getMonth() + 1))) {
                        passedWorkingDays++;
                    }
                }
            }
        }
        if (workingDaysInMonth === 0) workingDaysInMonth = 22;

        const dailyRate = Math.round(baseSalary / workingDaysInMonth);

        
        const existingAdvances = await prisma.payrollAdvance.findMany({
            where: {
                employeeId: payload.employeeId,
                month: targetMonth,
                year: targetYear,
                status: { not: PayrollStatus.CANCELLED },
            },
        });

        const postBaselineAdvances = existingAdvances.filter((a) => {
            if (!isSalaryPaid) return true;
            if (a.status === PayrollStatus.CANCELLED) return false;
            if (salaryPaidTime && new Date(a.createdAt || a.paidDate || 0).getTime() <= salaryPaidTime) return false;
            const aDate = new Date(a.paidDate || a.createdAt);
            return aDate.getDate() > cutoffDay;
        });

        const alreadyTakenAdvancesTotal = postBaselineAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
        const grossEarnedSoFar = passedWorkingDays * dailyRate;
        const availableEarnedSalary = Math.max(0, grossEarnedSoFar - alreadyTakenAdvancesTotal);

        if (amount > availableEarnedSalary) {
            throw new AppError(
                `Avans miqdori hozirgi kungacha ishlangan to'plangan maoshdan (${availableEarnedSalary.toLocaleString()} UZS) oshmasligi kerak. Kunlik stavka: ${dailyRate.toLocaleString()} UZS/kun (${passedWorkingDays} ish kuni o'tdi).`,
                400
            );
        }

        let dueDate: Date;
        if (payload.dueDate && !isNaN(new Date(payload.dueDate).getTime())) {
            dueDate = new Date(payload.dueDate);
        } else if (payload.isEarly) {
            dueDate = new Date();
        } else {
            const sched = await this.getPayrollSchedule(currentUser);
            const day = Math.min(28, Math.max(1, sched.advancePayDay || 20));
            dueDate = new Date(targetYear, targetMonth - 1, day);
        }

        const advance = await prisma.payrollAdvance.create({
            data: {
                employeeId: payload.employeeId,
                amount,
                month: targetMonth,
                year: targetYear,
                dueDate,
                isEarly: Boolean(payload.isEarly),
                reason: payload.reason?.trim() || null,
                companyName,
                createdById: currentUser?.id || null,
                status: PayrollStatus.AWAITING_CONFIRMATION,
            },
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
        });

        if (employee.user?.id) {
            try {
                await notificationService.createAndSendNotification({
                    userId: employee.user.id,
                    title: "Avans to'lovi o'tkazildi (Tasdiqlash kutilmoqda)",
                    message: `${targetMonth}-oy uchun ${amount.toLocaleString()} UZS miqdorida avans to'lovi o'tkazildi. Iltimos, profilingizda avansni qabul qilganingizni tasdiqlang.`,
                    type: "SALARY_PAID" as any,
                    metadata: { link: "/profile?tab=payroll", advanceId: advance.id },
                });
            } catch (notifErr) {
                console.error("Failed to send advance creation notification:", notifErr);
            }
        }

        await this.syncPayrollDeductionsAndNet(payload.employeeId, targetMonth, targetYear);

        return advance;
    }

    async updateAdvanceStatus(id: string, payload: {
        status: PayrollStatus;
        paidDate?: string;
        paymentMethod?: string;
        note?: string;
    }, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const advance = await prisma.payrollAdvance.findUnique({
            where: { id },
            include: { employee: { include: { user: { select: { id: true, email: true, companyName: true } } } } },
        });

        if (!advance) {
            throw new AppError("Avans topilmadi", 404);
        }

        if (
            callerCompany &&
            advance.employee?.user?.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            advance.employee.user.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const targetStatus = payload.status;
        const paidDate = targetStatus === PayrollStatus.PAID
            ? (payload.paidDate && !isNaN(new Date(payload.paidDate).getTime()) ? new Date(payload.paidDate) : new Date())
            : null;

        const updated = await prisma.payrollAdvance.update({
            where: { id },
            data: {
                status: targetStatus,
                paidDate,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        user: { select: { id: true, email: true } },
                    },
                },
            },
        });

        if (targetStatus === PayrollStatus.AWAITING_CONFIRMATION) {
            if (advance.employee?.user?.id) {
                try {
                    await notificationService.createAndSendNotification({
                        userId: advance.employee.user.id,
                        title: "Avans to'lovi o'tkazildi (Tasdiqlash kutilmoqda)",
                        message: `${advance.month}-oy uchun ${advance.amount.toLocaleString()} UZS miqdorida avans to'lovi o'tkazildi. Iltimos, profilingizda avansni qabul qilganingizni tasdiqlang.`,
                        type: "SALARY_PAID" as any,
                        metadata: { link: "/profile?tab=payroll", advanceId: advance.id },
                    });
                } catch (notifErr) {
                    console.error("Failed to send advance notification:", notifErr);
                }
            }
        }

        if (targetStatus === PayrollStatus.PAID) {
            const existingRecord = await prisma.payrollPaymentRecord.findFirst({
                where: { advanceId: advance.id },
            });
            if (!existingRecord) {
                await prisma.payrollPaymentRecord.create({
                    data: {
                        employeeId: advance.employeeId,
                        advanceId: advance.id,
                        paymentType: "ADVANCE",
                        month: advance.month,
                        year: advance.year,
                        amount: advance.amount,
                        paymentMethod: payload.paymentMethod || "BANK_CARD",
                        paidAt: paidDate || new Date(),
                        paidById: currentUser?.id || null,
                        confirmedAt: new Date(),
                        note: payload.note || advance.reason || `${advance.month}/${advance.year} avans to'lovi`,
                        companyName: advance.employee?.user?.companyName || advance.companyName || callerCompany,
                    },
                });
            }

            await this.syncPayrollDeductionsAndNet(advance.employeeId, advance.month, advance.year);

            if (advance.employee?.user?.id) {
                try {
                    await notificationService.createAndSendNotification({
                        userId: advance.employee.user.id,
                        title: "Avans to'landi",
                        message: `${advance.month}-oy uchun ${advance.amount.toLocaleString()} UZS miqdorida avans to'landi.`,
                        type: "SALARY_PAID" as any,
                    });
                } catch (notifErr) {
                    console.error("Failed to send advance paid notification:", notifErr);
                }
            }
        }

        return updated;
    }

    async confirmAdvanceReceipt(advanceId: string, currentUser?: any) {
        if (!currentUser?.id) {
            throw new AppError("Avtorizatsiyadan o'tilmagan", 401);
        }

        const advance = await prisma.payrollAdvance.findUnique({
            where: { id: advanceId },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, email: true, companyName: true } },
                    },
                },
            },
        });

        if (!advance) {
            throw new AppError("Avans topilmadi", 404);
        }

        const employeeRecord = await prisma.employee.findFirst({
            where: {
                OR: [
                    { id: advance.employeeId },
                    { userId: currentUser.id },
                ],
            },
            select: { id: true, userId: true },
        });

        const isRecipient =
            advance.employee?.userId === currentUser.id ||
            advance.employee?.user?.id === currentUser.id ||
            (employeeRecord && employeeRecord.userId === currentUser.id) ||
            (employeeRecord && employeeRecord.id === advance.employeeId);

        const isPrivileged =
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "ACCOUNTANT";

        if (!isRecipient && !isPrivileged) {
            throw new AppError("Faqat avans egasi yoki mas'ul xodim to'lovni tasdiqlashi mumkin", 403);
        }

        if (advance.status === PayrollStatus.PAID) {
            return advance;
        }

        const company =
            advance.employee?.user?.companyName ||
            advance.companyName ||
            currentUser?.companyName ||
            null;

        const updated = await prisma.payrollAdvance.update({
            where: { id: advanceId },
            data: {
                status: PayrollStatus.PAID,
                paidDate: new Date(),
            },
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
        });

        const existingRecord = await prisma.payrollPaymentRecord.findFirst({
            where: { advanceId: advance.id },
        });

        if (!existingRecord) {
            await prisma.payrollPaymentRecord.create({
                data: {
                    employeeId: advance.employeeId,
                    advanceId: advance.id,
                    paymentType: "ADVANCE",
                    month: advance.month,
                    year: advance.year,
                    amount: advance.amount,
                    paymentMethod: "BANK_CARD",
                    paidAt: new Date(),
                    paidById: advance.createdById || null,
                    confirmedAt: new Date(),
                    note: advance.reason || `${advance.month}/${advance.year} avans to'lovi`,
                    companyName: company,
                },
            });
        }

        await this.syncPayrollDeductionsAndNet(advance.employeeId, advance.month, advance.year);

        if (advance.createdById && advance.createdById !== currentUser.id) {
            try {
                const empName = advance.employee
                    ? `${advance.employee.firstName || ""} ${advance.employee.lastName || ""}`.trim()
                    : "Xodim";
                await notificationService.createAndSendNotification({
                    userId: advance.createdById,
                    title: "Avans to'lovi tasdiqlandi",
                    message: `${empName} ${advance.month}-oy uchun ${advance.amount.toLocaleString()} UZS miqdoridagi avansni qabul qilganini tasdiqladi.`,
                    type: "SALARY_PAID" as any,
                });
            } catch (notifErr) {
                console.error("Failed to send advance confirmation notification to accountant:", notifErr);
            }
        }

        return updated;
    }

    async getMyAdvances(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
            include: { user: { select: { companyName: true } } },
        });

        if (!employee) {
            throw new AppError("Xodim profili topilmadi", 404);
        }

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const pastPaidAdvances = await prisma.payrollAdvance.findMany({
            where: {
                employeeId: employee.id,
                status: PayrollStatus.PAID,
                OR: [
                    { year: { lt: currentYear } },
                    { year: currentYear, month: { lt: currentMonth } },
                ],
            },
        });

        for (const pa of pastPaidAdvances) {
            const existingRec = await prisma.payrollPaymentRecord.findFirst({
                where: { advanceId: pa.id },
            });
            if (!existingRec) {
                await prisma.payrollPaymentRecord.create({
                    data: {
                        employeeId: pa.employeeId,
                        advanceId: pa.id,
                        paymentType: "ADVANCE",
                        month: pa.month,
                        year: pa.year,
                        amount: pa.amount,
                        paymentMethod: "BANK_CARD",
                        paidAt: pa.paidDate || new Date(),
                        confirmedAt: pa.paidDate || new Date(),
                        note: pa.reason || `${pa.month}/${pa.year} avans to'lovi`,
                        companyName: employee.user?.companyName || pa.companyName || null,
                    },
                });
            }
        }

        if (pastPaidAdvances.length > 0) {
            await prisma.payrollAdvance.deleteMany({
                where: {
                    id: { in: pastPaidAdvances.map((a) => a.id) },
                },
            });
        }

        return prisma.payrollAdvance.findMany({
            where: { employeeId: employee.id },
            orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
        });
    }

    async deleteAdvance(id: string, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const advance = await prisma.payrollAdvance.findUnique({
            where: { id },
            include: { employee: { include: { user: { select: { companyName: true } } } } },
        });

        if (!advance) {
            throw new AppError("Avans topilmadi", 404);
        }

        if (
            callerCompany &&
            advance.employee?.user?.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            advance.employee.user.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        if (advance.status === PayrollStatus.PAID && callerRole !== "DIRECTOR" && callerRole !== "SUPER_ADMIN") {
            throw new AppError("To'langan avansni faqat Direktor o'chirish huquqiga ega", 403);
        }

        if (advance.status === PayrollStatus.PAID) {
            await prisma.payrollPaymentRecord.deleteMany({
                where: { advanceId: advance.id },
            });
        }

        const deleted = await prisma.payrollAdvance.delete({
            where: { id },
        });

        await this.syncPayrollDeductionsAndNet(advance.employeeId, advance.month, advance.year);

        return deleted;
    }

    async syncPayrollDeductionsAndNet(employeeId: string, month: number, year: number) {
        const results = await this.calculateAutoPayroll({ month, year, employeeId });
        if (!results || results.length === 0) return;
        const item = results[0];

        const existing = await prisma.payroll.findUnique({
            where: {
                employeeId_month_year: {
                    employeeId,
                    month,
                    year,
                },
            },
        });

        if (existing) {
            if (existing.status !== PayrollStatus.PAID) {
                await prisma.payroll.update({
                    where: { id: existing.id },
                    data: {
                        baseSalary: item.baseSalary,
                        salaryType: item.salaryType,
                        hourlyRate: item.hourlyRate,
                        workedHours: item.workedHours,
                        grossSalary: item.grossSalary,
                        taxPercent: item.taxPercent,
                        taxAmount: item.taxAmount,
                        bonus: item.bonus,
                        deductions: item.deductions,
                        netSalary: item.netSalary,
                    },
                });
            }
        } else {
            await prisma.payroll.create({
                data: {
                    employeeId,
                    month,
                    year,
                    baseSalary: item.baseSalary,
                    salaryType: item.salaryType,
                    hourlyRate: item.hourlyRate,
                    workedHours: item.workedHours,
                    grossSalary: item.grossSalary,
                    taxPercent: item.taxPercent,
                    taxAmount: item.taxAmount,
                    bonus: item.bonus,
                    deductions: item.deductions,
                    netSalary: item.netSalary,
                    status: PayrollStatus.PENDING,
                    companyName: item.companyName,
                },
            });
        }
    }

    async calculateMonthlyAttendanceHours(employeeId: string, month: number, year: number): Promise<{
        workedHours: number;
        lateDays: number;
        totalLateMinutes: number;
        attendedDays: number;
    }> {
        const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const now = new Date();

        const attendances = await prisma.attendance.findMany({
            where: {
                employeeId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { date: "asc" },
        });

        let totalWorkedHours = 0;
        let lateDays = 0;
        let totalLateMinutes = 0;
        let attendedDays = 0;

        attendances.forEach((a) => {
            if (a.checkIn && a.checkOut) {
                const duration = (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / (1000 * 60 * 60);
                totalWorkedHours += Math.max(0, duration);
                attendedDays++;
            } else if (a.checkIn && a.date) {
                const attDate = new Date(a.date);
                const isToday = attDate.toDateString() === now.toDateString();
                if (isToday) {
                    const duration = (now.getTime() - new Date(a.checkIn).getTime()) / (1000 * 60 * 60);
                    totalWorkedHours += Math.max(0, duration);
                } else {
                    totalWorkedHours += 8;
                }
                attendedDays++;
            } else if (a.checkIn || a.status === "PRESENT" || a.status === "LATE") {
                totalWorkedHours += 8;
                attendedDays++;
            } else if (a.status === "HALF_DAY") {
                totalWorkedHours += 4;
                attendedDays++;
            }

            const lateMin = a.lateMinutes || 0;
            let isLateByCheckIn = false;
            if (a.checkIn) {
                const d = new Date(a.checkIn);
                const minutes = d.getHours() * 60 + d.getMinutes();
                if (minutes > 9 * 60 + 15) {
                    isLateByCheckIn = true;
                    if (lateMin === 0) {
                        totalLateMinutes += minutes - 9 * 60;
                    }
                }
            }
            if (lateMin > 0 || isLateByCheckIn || a.status === "LATE") {
                lateDays++;
                if (lateMin > 0) {
                    totalLateMinutes += lateMin;
                }
            }
        });

        const workedHours = Math.round(totalWorkedHours * 10) / 10;
        return { workedHours, lateDays, totalLateMinutes, attendedDays };
    }

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

        const employeeWhere: any = {
            user: {
                role: { notIn: [Role.DIRECTOR, Role.SUPER_ADMIN] },
            },
        };
        if (payload.employeeId) {
            employeeWhere.id = payload.employeeId;
        }
        if (companyFilter) {
            employeeWhere.user.companyName = companyFilter;
        }

        const [employees, penaltyRules, manualPenalties, paidAdvances, approvedLeaves, schedules] = await Promise.all([
            prisma.employee.findMany({
                where: employeeWhere,
                include: {
                    department: true,
                    position: true,
                    user: { select: { email: true, companyName: true, createdAt: true } },
                    objectives: {
                        include: {
                            keyResults: true,
                        },
                    },
                },
            }),
            prisma.payrollPenaltyRule.findMany({
                where: { companyName: companyFilter },
            }),
            prisma.employeePenalty.findMany({
                where: {
                    month: Number(payload.month),
                    year: Number(payload.year),
                    ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
                },
                include: { rule: true },
            }),
            prisma.payrollAdvance.findMany({
                where: {
                    month: Number(payload.month),
                    year: Number(payload.year),
                    status: PayrollStatus.PAID,
                    ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
                },
            }),
            prisma.leaveRequest.findMany({
                where: {
                    status: "APPROVED",
                    startDate: { lte: new Date(payload.year, payload.month, 0, 23, 59, 59, 999) },
                    endDate: { gte: new Date(payload.year, payload.month - 1, 1, 0, 0, 0, 0) },
                    ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
                },
            }),
            prisma.workSchedule.findMany(),
        ]);

        if (employees.length === 0) {
            return [];
        }

        const defaultSchedule = schedules.find((s) => s.isDefault) || {
            id: "default",
            name: "Standart Ish Jadvali",
            startTime: "09:00",
            endTime: "18:00",
            workingDays: [1, 2, 3, 4, 5],
            gracePeriodMinutes: 15,
        };

        const absenceRule = penaltyRules.find((r) => r.code === "ABSENCE" && r.isAuto);
        const lateFixedRule = penaltyRules.find((r) => r.code === "LATE_FIXED" && r.isAuto);
        const lateMinuteRule = penaltyRules.find((r) => r.code === "LATE_MINUTES" && r.isAuto);

        const startDate = new Date(payload.year, payload.month - 1, 1);
        const endDate = new Date(payload.year, payload.month, 0, 23, 59, 59);

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const isFutureMonth = payload.year > currentYear || (payload.year === currentYear && payload.month > currentMonth);
        const isCurrentMonth = payload.year === currentYear && payload.month === currentMonth;

        const results = await Promise.all(
            employees.map(async (emp) => {
                const salaryType = emp.salaryType || "MONTHLY";
                const hourlyRate = emp.hourlyRate || 0;
                const taxPercent = emp.taxPercent !== undefined && emp.taxPercent !== null ? emp.taxPercent : 12;

                const empSchedule =
                    schedules.find((s) => s.employeeId === emp.id) ||
                    (emp.departmentId ? schedules.find((s) => s.departmentId === emp.departmentId) : null) ||
                    defaultSchedule;

                const workingDaysArr = empSchedule.workingDays || [1, 2, 3, 4, 5];

                let workingDaysInMonth = 0;
                const curIter = new Date(startDate);
                while (curIter <= endDate) {
                    const dow = curIter.getDay() === 0 ? 7 : curIter.getDay();
                    if (workingDaysArr.includes(dow)) {
                        workingDaysInMonth++;
                    }
                    curIter.setDate(curIter.getDate() + 1);
                }
                if (workingDaysInMonth === 0) workingDaysInMonth = 22;

                const attendances = await prisma.attendance.findMany({
                    where: {
                        employeeId: emp.id,
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                });

                const empCreatedAtRaw = emp.createdAt || emp.user?.createdAt || startDate;
                const empCreatedAt = new Date(empCreatedAtRaw);
                empCreatedAt.setHours(0, 0, 0, 0);

                const evalStartDate = empCreatedAt > startDate ? empCreatedAt : startDate;
                const evalEndDate = isCurrentMonth
                    ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
                    : endDate;

                const empLeaves = approvedLeaves.filter((l) => l.employeeId === emp.id);

                let attendedDays = 0;
                let absentDays = 0;

                if (!isFutureMonth && evalStartDate <= evalEndDate) {
                    const curDay = new Date(evalStartDate);
                    while (curDay <= evalEndDate) {
                        const dow = curDay.getDay() === 0 ? 7 : curDay.getDay();
                        if (workingDaysArr.includes(dow)) {
                            const curDayStr = curDay.toISOString().split("T")[0];
                            const isToday = curDay.toDateString() === now.toDateString();

                            const att = attendances.find((a) => {
                                const attStr = a.date ? new Date(a.date).toISOString().split("T")[0] : "";
                                return attStr === curDayStr;
                            });

                            const onLeave = empLeaves.some((l) => {
                                const sStr = new Date(l.startDate).toISOString().split("T")[0];
                                const eStr = new Date(l.endDate).toISOString().split("T")[0];
                                return curDayStr >= sStr && curDayStr <= eStr;
                            });

                            if (att?.checkIn || att?.status === "PRESENT" || att?.status === "LATE" || att?.status === "HALF_DAY") {
                                attendedDays++;
                            } else if (onLeave || att?.absenceReason || att?.status === "ON_LEAVE") {
                            } else if (!isToday) {
                                absentDays++;
                            }
                        }
                        curDay.setDate(curDay.getDate() + 1);
                    }
                }

                const attendanceHoursData = await this.calculateMonthlyAttendanceHours(emp.id, payload.month, payload.year);
                const workedHours = attendanceHoursData.workedHours;
                const lateDays = attendanceHoursData.lateDays;
                const totalLateMinutes = attendanceHoursData.totalLateMinutes;

                let latePenalty = 0;
                if (lateFixedRule && lateDays > 0) {
                    latePenalty += lateDays * lateFixedRule.amount;
                } else if (lateMinuteRule && totalLateMinutes > 0) {
                    latePenalty += totalLateMinutes * lateMinuteRule.amount;
                } else if (totalLateMinutes > 0) {
                    latePenalty += Math.max(10000, totalLateMinutes * 2000);
                }

                let baseSalary = 0;
                let absentDeduction = 0;
                let attendanceDeduction = 0;

                if (salaryType === "HOURLY") {
                    baseSalary = Math.round(workedHours * hourlyRate);
                    absentDeduction = 0;
                    attendanceDeduction = latePenalty;
                } else {
                    baseSalary = emp.salary && emp.salary > 0 ? emp.salary : 5000000;
                    if (absentDays > 0) {
                        if (absenceRule) {
                            if (absenceRule.penaltyType === "PERCENT") {
                                absentDeduction = Math.round((baseSalary / workingDaysInMonth) * absentDays * (absenceRule.amount / 100));
                            } else {
                                absentDeduction = Math.round(absentDays * absenceRule.amount);
                            }
                        }
                    }
                    attendanceDeduction = Math.min(Math.round(baseSalary * 0.7), absentDeduction + latePenalty);
                }

                const empManualPenalties = manualPenalties.filter((p) => p.employeeId === emp.id);
                const manualPenaltiesTotal = empManualPenalties.reduce((sum, p) => sum + p.amount, 0);

                const empAdvances = paidAdvances.filter((a) => a.employeeId === emp.id);
                const advancesTotal = empAdvances.reduce((sum, a) => sum + a.amount, 0);

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
                const grossSalary = baseSalary + totalBonus;
                const taxAmount = Math.round(grossSalary * (taxPercent / 100));
                const totalDeductions = attendanceDeduction + manualPenaltiesTotal + advancesTotal + taxAmount;
                const netSalary = Math.max(0, grossSalary - totalDeductions);

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
                    salaryType,
                    hourlyRate,
                    workedHours,
                    baseSalary,
                    grossSalary,
                    taxPercent,
                    taxAmount,
                    attendanceStats: {
                        workingDays: workingDaysInMonth,
                        attendedDays,
                        workedHours,
                        lateDays,
                        totalLateMinutes,
                        absentDays,
                        absentDeduction,
                        latePenalty,
                        totalAttendanceDeduction: attendanceDeduction,
                    },
                    manualPenalties: empManualPenalties.map((p) => ({
                        id: p.id,
                        reason: p.reason,
                        amount: p.amount,
                        ruleName: p.rule?.name || null,
                    })),
                    manualPenaltiesTotal,
                    advances: empAdvances.map((a) => ({
                        id: a.id,
                        amount: a.amount,
                        reason: a.reason,
                        paidDate: a.paidDate,
                    })),
                    advancesTotal,
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
                        salaryType: item.salaryType,
                        hourlyRate: item.hourlyRate,
                        workedHours: item.workedHours,
                        grossSalary: item.grossSalary,
                        taxPercent: item.taxPercent,
                        taxAmount: item.taxAmount,
                        bonus: item.bonus,
                        deductions: item.deductions,
                        netSalary: item.netSalary,
                    },
                    create: {
                        employeeId: item.employeeId,
                        month: payload.month,
                        year: payload.year,
                        baseSalary: item.baseSalary,
                        salaryType: item.salaryType,
                        hourlyRate: item.hourlyRate,
                        workedHours: item.workedHours,
                        grossSalary: item.grossSalary,
                        taxPercent: item.taxPercent,
                        taxAmount: item.taxAmount,
                        bonus: item.bonus,
                        deductions: item.deductions,
                        netSalary: item.netSalary,
                        status: PayrollStatus.PENDING,
                        companyName: item.companyName,
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

        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const employee = await prisma.employee.findUnique({
            where: { id: payload.employeeId },
            include: { user: { select: { companyName: true } } },
        });

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        if (
            callerCompany &&
            employee.user?.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            employee.user.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const existing = await prisma.payroll.findUnique({
            where: {
                employeeId_month_year: {
                    employeeId: payload.employeeId,
                    month: Number(payload.month),
                    year: Number(payload.year),
                },
            },
        });

        if (existing) {
            return prisma.payroll.update({
                where: { id: existing.id },
                data: {
                    baseSalary: Number(payload.baseSalary),
                    bonus,
                    deductions,
                    netSalary,
                },
            });
        }

        return prisma.payroll.create({
            data: {
                employeeId: payload.employeeId,
                month: Number(payload.month),
                year: Number(payload.year),
                baseSalary: Number(payload.baseSalary),
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

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        
        const pastPaidPayrolls = await prisma.payroll.findMany({
            where: {
                employeeId: employee.id,
                status: PayrollStatus.PAID,
                OR: [
                    { year: { lt: currentYear } },
                    { year: currentYear, month: { lt: currentMonth } },
                ],
            },
        });

        
        for (const pp of pastPaidPayrolls) {
            const existingRec = await prisma.payrollPaymentRecord.findFirst({
                where: { payrollId: pp.id },
            });
            if (!existingRec) {
                await prisma.payrollPaymentRecord.create({
                    data: {
                        employeeId: pp.employeeId,
                        payrollId: pp.id,
                        paymentType: "SALARY",
                        month: pp.month,
                        year: pp.year,
                        amount: pp.netSalary,
                        baseSalary: pp.baseSalary,
                        bonus: pp.bonus,
                        deductions: pp.deductions,
                        paymentMethod: pp.paymentMethod || "BANK_CARD",
                        paidAt: pp.confirmedAt || pp.disbursedAt || new Date(),
                        paidById: pp.disbursedById || null,
                        confirmedAt: pp.confirmedAt || new Date(),
                        note: pp.paymentNote || `${pp.month}/${pp.year} oylik maosh to'lovi`,
                        companyName: employee.user?.companyName || pp.companyName || null,
                    },
                });
            }
        }

        
        if (pastPaidPayrolls.length > 0) {
            await prisma.payroll.deleteMany({
                where: {
                    id: { in: pastPaidPayrolls.map((p) => p.id) },
                },
            });
        }

        
        await this.syncPayrollDeductionsAndNet(employee.id, currentMonth, currentYear);

        
        const sched = await this.getPayrollSchedule({ companyName: employee.user?.companyName });
        const salaryPayDay = sched.salaryPayDay || 5;
        const isSalaryDue = now.getDate() >= salaryPayDay;

        let payrolls = await prisma.payroll.findMany({
            where: { employeeId: employee.id },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        salary: true,
                        salaryType: true,
                        hourlyRate: true,
                        taxPercent: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                    },
                },
            },
            orderBy: [{ year: "desc" }, { month: "desc" }],
        });

        
        if (isSalaryDue) {
            for (const p of payrolls) {
                if (p.year === currentYear && p.month === currentMonth && (p.status === PayrollStatus.PENDING || (p.status as any) === "DRAFT")) {
                    await prisma.payroll.update({
                        where: { id: p.id },
                        data: { status: PayrollStatus.AWAITING_CONFIRMATION },
                    });
                    p.status = PayrollStatus.AWAITING_CONFIRMATION;
                }
            }
        }

        const enrichedPayrolls = await Promise.all(
            payrolls.map(async (p) => {
                const penaltiesSummary = await this.getPenaltiesSummary({
                    month: p.month,
                    year: p.year,
                }, { id: employee.userId });

                const empSummary = penaltiesSummary?.employeeSummaries?.find((s: any) => s.employeeId === employee.id);
                const totalPenalties = empSummary ? empSummary.totalFines : 0;

                const penalties = await prisma.employeePenalty.findMany({
                    where: {
                        employeeId: employee.id,
                        month: p.month,
                        year: p.year,
                    },
                    include: {
                        rule: { select: { id: true, name: true, code: true, penaltyType: true } },
                    },
                    orderBy: { date: "asc" },
                });

                const advances = await prisma.payrollAdvance.findMany({
                    where: {
                        employeeId: employee.id,
                        month: p.month,
                        year: p.year,
                        status: { not: PayrollStatus.CANCELLED },
                    },
                    orderBy: { dueDate: "asc" },
                });

                const paidAdvances = advances.filter((a) => a.status === PayrollStatus.PAID);
                const advancesTotal = paidAdvances.reduce((sum, adv) => sum + adv.amount, 0);

                const salaryType = p.salaryType || employee.salaryType || "MONTHLY";
                const hourlyRate = p.hourlyRate || employee.hourlyRate || 0;
                const taxPercent = p.taxPercent !== null && p.taxPercent !== undefined ? p.taxPercent : (employee.taxPercent ?? 12);

                let baseSalary = p.baseSalary;
                let workedHours = p.workedHours || 0;
                if (salaryType === "HOURLY" && p.status !== PayrollStatus.PAID) {
                    const hoursData = await this.calculateMonthlyAttendanceHours(employee.id, p.month, p.year);
                    workedHours = hoursData.workedHours;
                    baseSalary = Math.round(workedHours * hourlyRate);
                }

                const grossSalary = baseSalary + p.bonus;
                const taxAmount = Math.round(grossSalary * (taxPercent / 100));

                let deductions = p.status === PayrollStatus.PAID ? p.deductions : (totalPenalties + advancesTotal + taxAmount);
                let netSalary = p.status === PayrollStatus.PAID ? p.netSalary : Math.max(0, grossSalary - deductions);

                if (p.status !== PayrollStatus.PAID) {
                    if (deductions !== p.deductions || netSalary !== p.netSalary || baseSalary !== p.baseSalary || !p.taxAmount) {
                        await prisma.payroll.update({
                            where: { id: p.id },
                            data: {
                                baseSalary,
                                workedHours,
                                deductions,
                                netSalary,
                                taxPercent,
                                taxAmount,
                                grossSalary,
                                salaryType,
                                hourlyRate,
                            },
                        });
                    }
                }

                return {
                    ...p,
                    baseSalary,
                    workedHours,
                    deductions,
                    netSalary,
                    grossSalary,
                    taxPercent,
                    taxAmount,
                    salaryType,
                    hourlyRate,
                    breakdown: {
                        penalties,
                        advances,
                        penaltySummary: empSummary,
                        baseSalary,
                        bonus: p.bonus,
                        grossSalary,
                        taxPercent,
                        taxAmount,
                        deductions,
                        netSalary,
                    },
                };
            })
        );

        return enrichedPayrolls;
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

        const where: any = {
            employee: {
                user: {
                    role: { notIn: [Role.DIRECTOR, Role.SUPER_ADMIN] },
                },
            },
        };

        if (query.month) where.month = Number(query.month);
        if (query.year) where.year = Number(query.year);

        if (query.status) {
            if (query.status === PayrollStatus.AWAITING_CONFIRMATION) {
                const advanceWhere: any = {
                    status: PayrollStatus.AWAITING_CONFIRMATION,
                };
                if (query.month) advanceWhere.month = Number(query.month);
                if (query.year) advanceWhere.year = Number(query.year);
                if (companyFilter) {
                    advanceWhere.employee = { user: { companyName: companyFilter } };
                }

                const awaitingAdvanceEmployeeIds = (
                    await prisma.payrollAdvance.findMany({
                        where: advanceWhere,
                        select: { employeeId: true },
                    })
                ).map((a) => a.employeeId);

                where.OR = [
                    { status: PayrollStatus.AWAITING_CONFIRMATION },
                    ...(awaitingAdvanceEmployeeIds.length > 0
                        ? [{ employeeId: { in: awaitingAdvanceEmployeeIds } }]
                        : []),
                ];
            } else if (query.status === PayrollStatus.PAID) {
                where.status = PayrollStatus.PAID;
            } else {
                where.status = query.status;
            }
        }

        if (companyFilter) {
            where.employee.user.companyName = companyFilter;
        }

        if (query.search) {
            where.employee.OR = [
                { firstName: { contains: query.search, mode: "insensitive" } },
                { lastName: { contains: query.search, mode: "insensitive" } },
            ];
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
                        salaryType: true,
                        hourlyRate: true,
                        taxPercent: true,
                        department: { select: { id: true, name: true } },
                        position: { select: { id: true, title: true } },
                        user: { select: { email: true, companyName: true } },
                    },
                },
            },
            orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
        });

        const penaltiesSummary = await this.getPenaltiesSummary({
            month: query.month || (new Date().getMonth() + 1),
            year: query.year || new Date().getFullYear(),
        }, currentUser);

        const summaryMap: Record<string, any> = {};
        if (penaltiesSummary?.employeeSummaries) {
            penaltiesSummary.employeeSummaries.forEach((s: any) => {
                summaryMap[s.employeeId] = s;
            });
        }

        const syncedPayrolls = await Promise.all(
            payrolls.map(async (p) => {
                if (p.status === PayrollStatus.PAID) {
                    return p;
                }
                const advances = await prisma.payrollAdvance.findMany({
                    where: {
                        employeeId: p.employeeId,
                        month: p.month,
                        year: p.year,
                        status: PayrollStatus.PAID,
                    },
                });
                const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);
                const empSummary = summaryMap[p.employeeId];
                const totalPenalties = empSummary ? empSummary.totalFines : 0;

                const salaryType = p.salaryType || p.employee?.salaryType || "MONTHLY";
                const hourlyRate = p.hourlyRate || p.employee?.hourlyRate || 0;
                const taxPercent = p.taxPercent !== null && p.taxPercent !== undefined ? p.taxPercent : (p.employee?.taxPercent ?? 12);

                let baseSalary = p.baseSalary;
                let workedHours = p.workedHours || 0;
                if (salaryType === "HOURLY") {
                    const hoursData = await this.calculateMonthlyAttendanceHours(p.employeeId, p.month, p.year);
                    workedHours = hoursData.workedHours;
                    baseSalary = Math.round(workedHours * hourlyRate);
                }

                const grossSalary = baseSalary + p.bonus;
                const taxAmount = Math.round(grossSalary * (taxPercent / 100));
                const newDeductions = totalAdvances + totalPenalties + taxAmount;
                const newNet = Math.max(0, grossSalary - newDeductions);

                if (newDeductions !== p.deductions || newNet !== p.netSalary || baseSalary !== p.baseSalary || !p.taxAmount) {
                    await prisma.payroll.update({
                        where: { id: p.id },
                        data: {
                            baseSalary,
                            workedHours,
                            salaryType,
                            hourlyRate,
                            taxPercent,
                            taxAmount,
                            grossSalary,
                            deductions: newDeductions,
                            netSalary: newNet,
                        },
                    });
                    return {
                        ...p,
                        baseSalary,
                        workedHours,
                        salaryType,
                        hourlyRate,
                        taxPercent,
                        taxAmount,
                        grossSalary,
                        deductions: newDeductions,
                        netSalary: newNet,
                        penaltyDetails: empSummary,
                    };
                }
                return {
                    ...p,
                    penaltyDetails: empSummary,
                };
            })
        );

        return syncedPayrolls;
    }

    async getEmployeeCompensations(currentUser?: any) {
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

        const employees = await prisma.employee.findMany({
            where: {
                user: {
                    role: { notIn: [Role.DIRECTOR, Role.SUPER_ADMIN] },
                    ...(companyFilter ? { companyName: companyFilter } : {}),
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                salary: true,
                salaryType: true,
                hourlyRate: true,
                taxPercent: true,
                department: { select: { id: true, name: true } },
                position: { select: { id: true, title: true } },
                user: { select: { email: true, companyName: true } },
            },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        });

        return employees;
    }

    async updateEmployeeCompensation(
        employeeId: string,
        payload: {
            salaryType?: "MONTHLY" | "HOURLY";
            salary?: number;
            hourlyRate?: number;
            taxPercent?: number;
        },
        currentUser?: any,
    ) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { user: { select: { companyName: true } } },
        });

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        if (
            callerCompany &&
            employee.user?.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            employee.user.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const updatedEmployee = await prisma.employee.update({
            where: { id: employeeId },
            data: {
                ...(payload.salaryType !== undefined && { salaryType: payload.salaryType }),
                ...(payload.salary !== undefined && { salary: Number(payload.salary) }),
                ...(payload.hourlyRate !== undefined && { hourlyRate: Number(payload.hourlyRate) }),
                ...(payload.taxPercent !== undefined && { taxPercent: Number(payload.taxPercent) }),
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                salary: true,
                salaryType: true,
                hourlyRate: true,
                taxPercent: true,
                department: { select: { id: true, name: true } },
                position: { select: { id: true, title: true } },
                user: { select: { email: true, companyName: true } },
            },
        });

        const now = new Date();
        await this.syncPayrollDeductionsAndNet(employeeId, now.getMonth() + 1, now.getFullYear()).catch((err) => {
            console.warn("Could not sync payroll after compensation update:", err);
        });

        return updatedEmployee;
    }

    async updateStatus(id: string, status: PayrollStatus, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const payroll = await prisma.payroll.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, email: true, companyName: true } },
                    },
                },
            },
        });

        if (!payroll) {
            throw new AppError("Ish haqi varaqasi topilmadi", 404);
        }

        if (
            callerCompany &&
            payroll.employee?.user?.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            payroll.employee.user.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const updated = await prisma.payroll.update({
            where: { id },
            data: { status },
        });

        if (status === PayrollStatus.PAID) {
            await prisma.payrollPaymentRecord.create({
                data: {
                    employeeId: payroll.employeeId,
                    payrollId: payroll.id,
                    paymentType: "SALARY",
                    month: payroll.month,
                    year: payroll.year,
                    amount: payroll.netSalary,
                    baseSalary: payroll.baseSalary,
                    bonus: payroll.bonus,
                    deductions: payroll.deductions,
                    paymentMethod: "BANK_CARD",
                    paidAt: new Date(),
                    paidById: currentUser?.id || null,
                    note: `${payroll.month}/${payroll.year} oylik maoshi to'lovi`,
                    companyName: payroll.employee.user?.companyName || callerCompany || null,
                },
            });

            if (payroll.employee?.user?.id) {
                await notificationService.createAndSendNotification({
                    userId: payroll.employee.user.id,
                    title: "Oylik maosh to'landi",
                    message: `${payroll.month}-oy uchun ${payroll.netSalary.toLocaleString()} UZS miqdorida ish haqi to'landi.`,
                    type: "SALARY_PAID" as any,
                });
            }
        }

        return updated;
    }

    async paySalary(payrollId: string, payload: {
        paymentMethod?: string;
        note?: string;
    }, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const payroll = await prisma.payroll.findUnique({
            where: { id: payrollId },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, email: true, companyName: true } },
                    },
                },
            },
        });

        if (!payroll) {
            throw new AppError("Ish haqi varaqasi topilmadi", 404);
        }

        if (
            callerCompany &&
            payroll.employee?.user?.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            payroll.employee.user.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const company = payroll.employee?.user?.companyName || callerCompany || null;

        
        const updated = await prisma.payroll.update({
            where: { id: payrollId },
            data: {
                status: PayrollStatus.AWAITING_CONFIRMATION,
                paymentMethod: payload.paymentMethod || "BANK_CARD",
                paymentNote: payload.note || `${payroll.month}/${payroll.year} oylik maoshi to'lovi`,
                disbursedAt: new Date(),
                disbursedById: currentUser?.id || null,
                companyName: company,
            },
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
        });

        if (payroll.employee?.user?.id) {
            try {
                await notificationService.createAndSendNotification({
                    userId: payroll.employee.user.id,
                    title: "Oylik maosh o'tkazildi (Tasdiqlash kutilmoqda)",
                    message: `${payroll.month}-oy uchun ${payroll.netSalary.toLocaleString()} UZS miqdorida ish haqi o'tkazildi. Iltimos, profilingizda maoshni qabul qilganingizni tasdiqlang.`,
                    type: "SALARY_PAID" as any,
                    metadata: { link: "/profile", payrollId: payroll.id },
                });
            } catch (notifErr) {
                console.error("Failed to send salary payment notification:", notifErr);
            }
        }

        return updated;
    }

    async confirmSalaryReceipt(payrollId: string, currentUser?: any) {
        if (!currentUser?.id) {
            throw new AppError("Avtorizatsiyadan o'tilmagan", 401);
        }

        const payroll = await prisma.payroll.findUnique({
            where: { id: payrollId },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, email: true, companyName: true } },
                    },
                },
            },
        });

        if (!payroll) {
            throw new AppError("Ish haqi varaqasi topilmadi", 404);
        }

        
        const employeeRecord = await prisma.employee.findFirst({
            where: {
                OR: [
                    { id: payroll.employeeId },
                    { userId: currentUser.id },
                ],
            },
            select: { id: true, userId: true },
        });

        const isRecipient =
            payroll.employee?.userId === currentUser.id ||
            payroll.employee?.user?.id === currentUser.id ||
            (employeeRecord && employeeRecord.userId === currentUser.id) ||
            (employeeRecord && employeeRecord.id === payroll.employeeId);

        const isPrivileged =
            currentUser.role === "SUPER_ADMIN" ||
            currentUser.role === "DIRECTOR" ||
            currentUser.role === "HR_ADMIN" ||
            currentUser.role === "ACCOUNTANT";

        if (!isRecipient && !isPrivileged) {
            throw new AppError("Faqat maosh egasi yoki mas'ul xodim to'lovni tasdiqlashi mumkin", 403);
        }

        if (payroll.status === PayrollStatus.PAID) {
            return payroll;
        }

        const company =
            payroll.employee?.user?.companyName ||
            payroll.companyName ||
            currentUser?.companyName ||
            null;

        const updated = await prisma.payroll.update({
            where: { id: payrollId },
            data: {
                status: PayrollStatus.PAID,
                confirmedAt: new Date(),
            },
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
        });

        
        const existingRecord = await prisma.payrollPaymentRecord.findFirst({
            where: { payrollId: payroll.id },
        });

        if (!existingRecord) {
            await prisma.payrollPaymentRecord.create({
                data: {
                    employeeId: payroll.employeeId,
                    payrollId: payroll.id,
                    paymentType: "SALARY",
                    month: payroll.month,
                    year: payroll.year,
                    amount: payroll.netSalary,
                    baseSalary: payroll.baseSalary,
                    bonus: payroll.bonus,
                    deductions: payroll.deductions,
                    paymentMethod: payroll.paymentMethod || "BANK_CARD",
                    paidAt: payroll.disbursedAt || new Date(),
                    paidById: payroll.disbursedById || null,
                    confirmedAt: new Date(),
                    note: payroll.paymentNote || `${payroll.month}/${payroll.year} oylik maosh to'lovi`,
                    companyName: company,
                },
            });
        }

        if (payroll.disbursedById && payroll.disbursedById !== currentUser.id) {
            try {
                const empName = payroll.employee
                    ? `${payroll.employee.firstName || ""} ${payroll.employee.lastName || ""}`.trim()
                    : "Xodim";
                await notificationService.createAndSendNotification({
                    userId: payroll.disbursedById,
                    title: "Oylik maosh qabul qilindi",
                    message: `${empName} ${payroll.month}-oy maoshini (${payroll.netSalary.toLocaleString()} UZS) qabul qilganini tasdiqladi.`,
                    type: "SALARY_PAID" as any,
                    metadata: { link: "/profile?tab=payroll", payrollId: payroll.id },
                });
            } catch (notifErr) {
                console.error("Failed to send salary confirmation notification:", notifErr);
            }
        }

        return updated;
    }

    async getPaymentRecords(query: {
        month?: number;
        year?: number;
        paymentType?: string;
        employeeId?: string;
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
        if (query.paymentType && query.paymentType !== "ALL") where.paymentType = query.paymentType;
        if (query.employeeId) where.employeeId = query.employeeId;

        if (companyFilter) {
            where.OR = [
                { companyName: companyFilter },
                { employee: { user: { companyName: companyFilter } } },
            ];
        }

        if (query.search) {
            where.employee = {
                ...(where.employee || {}),
                OR: [
                    { firstName: { contains: query.search, mode: "insensitive" } },
                    { lastName: { contains: query.search, mode: "insensitive" } },
                ],
            };
        }

        return prisma.payrollPaymentRecord.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                        user: { select: { email: true } },
                    },
                },
            },
            orderBy: { paidAt: "desc" },
        });
    }

    async deletePaymentRecord(id: string, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        if (callerRole !== "DIRECTOR" && callerRole !== "SUPER_ADMIN") {
            throw new AppError("To'langan to'lovlar tarixini faqat Direktor o'chirish huquqiga ega", 403);
        }

        const record = await prisma.payrollPaymentRecord.findUnique({
            where: { id },
            include: { employee: { include: { user: { select: { companyName: true } } } } },
        });

        if (!record) {
            throw new AppError("To'lov yozuvi topilmadi", 404);
        }

        const recordCompany = record.companyName || record.employee?.user?.companyName;

        if (
            callerCompany &&
            recordCompany &&
            callerRole !== "SUPER_ADMIN" &&
            recordCompany !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        return prisma.payrollPaymentRecord.delete({
            where: { id },
        });
    }

    async clearAllPaymentRecords(currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        if (callerRole !== "DIRECTOR" && callerRole !== "SUPER_ADMIN") {
            throw new AppError("To'lovlar tarixini faqat Direktor tozalash huquqiga ega", 403);
        }

        const whereClause: any = {};
        if (callerRole !== "SUPER_ADMIN") {
            if (!callerCompany) {
                throw new AppError("Kompaniya aniqlanmadi", 400);
            }
            whereClause.OR = [
                { companyName: callerCompany },
                { employee: { user: { companyName: callerCompany } } },
            ];
        }

        const result = await prisma.payrollPaymentRecord.deleteMany({
            where: whereClause,
        });

        return { count: result.count };
    }

    async checkAndNotifyDuePayments(currentUser?: any) {
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

        const schedule = await this.getPayrollSchedule(currentUser);
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const lead = schedule.notificationLeadDays || 2;

        const salaryPayDay = schedule.salaryPayDay || 5;
        const advancePayDay = schedule.advancePayDay || 20;

        const isSalaryDue = (currentDay >= salaryPayDay - lead && currentDay <= salaryPayDay + 5) || currentDay > salaryPayDay;
        const isAdvanceDue = schedule.isAdvanceEnabled && ((currentDay >= advancePayDay - lead && currentDay <= advancePayDay + 5) || currentDay > advancePayDay);

        const employeeWhere: any = {
            user: {
                role: { notIn: [Role.DIRECTOR, Role.SUPER_ADMIN] },
            },
        };
        if (companyFilter) {
            employeeWhere.user.companyName = companyFilter;
        }

        const allEmployees = await prisma.employee.findMany({
            where: employeeWhere,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                salary: true,
                department: { select: { name: true } },
                position: { select: { title: true } },
            },
        });

        const pendingPayrolls = await prisma.payroll.findMany({
            where: {
                month: currentMonth,
                year: currentYear,
                status: PayrollStatus.PENDING,
                ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
            },
            include: { employee: { select: { id: true, firstName: true, lastName: true } } },
        });

        const pendingAdvances = await prisma.payrollAdvance.findMany({
            where: {
                month: currentMonth,
                year: currentYear,
                status: PayrollStatus.PENDING,
                ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
            },
            include: { employee: { select: { id: true, firstName: true, lastName: true } } },
        });

        if (isSalaryDue && pendingPayrolls.length > 0) {
            await notificationService.notifyAllUsers({
                title: "Oylik maosh to'lovi muddati",
                message: `${currentMonth}-oy uchun ${pendingPayrolls.length} nafar xodimga oylik maosh to'lash vaqti keldi.`,
                type: "PAYROLL_DUE_REMINDER" as any,
                targetRoles: ["ACCOUNTANT"],
                companyName: companyFilter || undefined,
            });
        }

        if (isAdvanceDue && pendingAdvances.length > 0) {
            await notificationService.notifyAllUsers({
                title: "Avans to'lovi muddati",
                message: `${currentMonth}-oy uchun ${pendingAdvances.length} nafar xodimga avans to'lash vaqti keldi.`,
                type: "ADVANCE_DUE_REMINDER" as any,
                targetRoles: ["ACCOUNTANT"],
                companyName: companyFilter || undefined,
            });
        }

        return {
            schedule,
            currentDate: now,
            salaryDue: {
                isDue: isSalaryDue,
                payDay: salaryPayDay,
                pendingCount: pendingPayrolls.length,
                pendingList: pendingPayrolls.map((p) => ({
                    id: p.id,
                    employeeId: p.employeeId,
                    name: `${p.employee.firstName} ${p.employee.lastName}`,
                    netSalary: p.netSalary,
                })),
            },
            advanceDue: {
                isDue: isAdvanceDue,
                payDay: advancePayDay,
                pendingCount: pendingAdvances.length,
                pendingList: pendingAdvances.map((a) => ({
                    id: a.id,
                    employeeId: a.employeeId,
                    name: `${a.employee.firstName} ${a.employee.lastName}`,
                    amount: a.amount,
                    isEarly: a.isEarly,
                    dueDate: a.dueDate,
                })),
            },
            allEmployeesCount: allEmployees.length,
        };
    }

    async deletePayroll(id: string, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

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
            callerCompany &&
            payroll.employee?.user?.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            payroll.employee.user.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        if (payroll.status === PayrollStatus.PAID && callerRole !== "DIRECTOR" && callerRole !== "SUPER_ADMIN") {
            throw new AppError("To'langan oylik varaqasini faqat Direktor o'chirish huquqiga ega", 403);
        }

        if (payroll.status === PayrollStatus.PAID) {
            await prisma.payrollPaymentRecord.deleteMany({
                where: { payrollId: payroll.id },
            });
        }

        return prisma.payroll.delete({
            where: { id },
        });
    }

    async syncRecurringExpensesForCompany(companyName?: string | null) {
        try {
            const rules = await prisma.companyRecurringExpense.findMany({
                where: {
                    isActive: true,
                    ...(companyName ? { companyName } : {}),
                },
            });

            if (!rules || rules.length === 0) return;

            const now = new Date();
            const nowYear = now.getFullYear();
            const nowMonth = now.getMonth() + 1; 
            const nowDay = now.getDate();

            for (const rule of rules) {
                const sYear = rule.startYear || nowYear;
                const sMonth = rule.startMonth || 1;

                for (let y = sYear; y <= nowYear; y++) {
                    const fromM = (y === sYear) ? sMonth : 1;
                    const toM = (y === nowYear) ? nowMonth : 12;

                    for (let m = fromM; m <= toM; m++) {
                        
                        if (y === nowYear && m === nowMonth && nowDay < (rule.recurringDay || 1)) {
                            continue;
                        }

                        const existing = await prisma.companyExpense.findFirst({
                            where: {
                                recurringGroupId: rule.id,
                                month: m,
                                year: y,
                                ...(rule.companyName ? { companyName: rule.companyName } : {}),
                            },
                        });

                        if (!existing) {
                            const daysInM = new Date(y, m, 0).getDate();
                            const actualDay = Math.min(Math.max(1, rule.recurringDay || 1), daysInM);
                            const expDate = new Date(Date.UTC(y, m - 1, actualDay, 12, 0, 0));

                            await prisma.companyExpense.create({
                                data: {
                                    title: rule.title,
                                    category: rule.category,
                                    amount: rule.amount,
                                    date: expDate,
                                    month: m,
                                    year: y,
                                    description: rule.description,
                                    paymentMethod: rule.paymentMethod || "BANK_TRANSFER",
                                    receiptUrl: rule.receiptUrl,
                                    isRecurring: true,
                                    recurringGroupId: rule.id,
                                    recurringDay: actualDay,
                                    companyName: rule.companyName,
                                    createdById: rule.createdById,
                                },
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error syncing recurring company expenses:", err);
        }
    }

    async getCompanyExpenses(
        params?: {
            month?: number | string;
            year?: number | string;
            category?: string;
            search?: string;
        },
        currentUser?: any,
    ) {
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                callerCompany = caller.companyName || null;
            } else if (caller && caller.role === "SUPER_ADMIN") {
                callerCompany = caller.companyName || null;
            }
        }

        await this.syncRecurringExpensesForCompany(callerCompany);

        const where: any = {
            ...(callerCompany ? { companyName: callerCompany } : {}),
        };

        if (params?.month && params.month !== "ALL") {
            where.month = Number(params.month);
        }
        if (params?.year) {
            where.year = Number(params.year);
        }
        if (params?.category && params.category !== "ALL") {
            where.category = params.category;
        }
        if (params?.search && params.search.trim()) {
            const s = params.search.trim();
            where.OR = [
                { title: { contains: s, mode: "insensitive" } },
                { description: { contains: s, mode: "insensitive" } },
            ];
        }

        return prisma.companyExpense.findMany({
            where,
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        });
    }

    async createCompanyExpense(
        payload: {
            title: string;
            category?: string;
            amount: number | string;
            date?: string;
            month?: number | string;
            year?: number | string;
            description?: string;
            paymentMethod?: string;
            receiptUrl?: string;
            isRecurring?: boolean;
            recurringDay?: number | string;
            recurringScope?: "ALL_YEAR" | "FROM_SELECTED_MONTH" | "SELECTED_MONTHS";
            recurringMonths?: number[];
        },
        currentUser?: any,
    ) {
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerCompany = caller.companyName || null;
            }
        }

        if (!payload.title || !payload.amount) {
            throw new AppError("Xarajat nomi va summasi talab qilinadi", 400);
        }

        const numAmount = Number(payload.amount);
        if (isNaN(numAmount) || numAmount < 0) {
            throw new AppError("Xarajat summasi musbat son bo'lishi kerak", 400);
        }

        const expDate = payload.date ? new Date(payload.date) : new Date();
        const baseMonth = payload.month ? Number(payload.month) : expDate.getMonth() + 1;
        const targetYear = payload.year ? Number(payload.year) : expDate.getFullYear();

        if (payload.isRecurring) {
            const preferredDay = payload.recurringDay
                ? Number(payload.recurringDay)
                : (payload.date ? new Date(payload.date).getDate() : 5);

            const rule = await prisma.companyRecurringExpense.create({
                data: {
                    title: payload.title.trim(),
                    category: payload.category || "OTHER",
                    amount: numAmount,
                    startMonth: baseMonth,
                    startYear: targetYear,
                    recurringDay: preferredDay,
                    description: payload.description ? payload.description.trim() : null,
                    paymentMethod: payload.paymentMethod || "BANK_TRANSFER",
                    receiptUrl: payload.receiptUrl || null,
                    isActive: true,
                    companyName: callerCompany,
                    createdById: currentUser?.id || null,
                },
            });

            await this.syncRecurringExpensesForCompany(callerCompany);

            const created = await prisma.companyExpense.findFirst({
                where: {
                    recurringGroupId: rule.id,
                    month: baseMonth,
                    year: targetYear,
                    ...(callerCompany ? { companyName: callerCompany } : {}),
                },
            });

            return created || rule;
        }

        return prisma.companyExpense.create({
            data: {
                title: payload.title.trim(),
                category: payload.category || "OTHER",
                amount: numAmount,
                date: expDate,
                month: baseMonth,
                year: targetYear,
                description: payload.description ? payload.description.trim() : null,
                paymentMethod: payload.paymentMethod || "BANK_TRANSFER",
                receiptUrl: payload.receiptUrl || null,
                isRecurring: false,
                companyName: callerCompany,
                createdById: currentUser?.id || null,
            },
        });
    }

    async updateCompanyExpense(
        id: string,
        payload: {
            title?: string;
            category?: string;
            amount?: number | string;
            date?: string;
            month?: number | string;
            year?: number | string;
            description?: string;
            paymentMethod?: string;
            receiptUrl?: string;
            isRecurring?: boolean;
            recurringDay?: number | string;
            updateScope?: "ONLY_THIS" | "ALL_RECURRING";
        },
        currentUser?: any,
    ) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const existing = await prisma.companyExpense.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new AppError("Xarajat topilmadi", 404);
        }

        if (
            callerCompany &&
            existing.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            existing.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const dataToUpdate: any = {};
        if (payload.title !== undefined) dataToUpdate.title = payload.title.trim();
        if (payload.category !== undefined) dataToUpdate.category = payload.category;
        if (payload.amount !== undefined) {
            const num = Number(payload.amount);
            if (isNaN(num) || num < 0) throw new AppError("Noto'g'ri summa", 400);
            dataToUpdate.amount = num;
        }
        if (payload.description !== undefined) dataToUpdate.description = payload.description?.trim() || null;
        if (payload.paymentMethod !== undefined) dataToUpdate.paymentMethod = payload.paymentMethod;
        if (payload.receiptUrl !== undefined) dataToUpdate.receiptUrl = payload.receiptUrl;

        if (payload.updateScope === "ALL_RECURRING" && existing.recurringGroupId) {
            await prisma.companyRecurringExpense.updateMany({
                where: {
                    id: existing.recurringGroupId,
                    ...(callerCompany ? { companyName: callerCompany } : {}),
                },
                data: {
                    ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
                    ...(payload.category !== undefined ? { category: payload.category } : {}),
                    ...(payload.amount !== undefined ? { amount: Number(payload.amount) } : {}),
                    ...(payload.description !== undefined ? { description: payload.description?.trim() || null } : {}),
                    ...(payload.paymentMethod !== undefined ? { paymentMethod: payload.paymentMethod } : {}),
                    ...(payload.receiptUrl !== undefined ? { receiptUrl: payload.receiptUrl } : {}),
                },
            });

            await prisma.companyExpense.updateMany({
                where: {
                    recurringGroupId: existing.recurringGroupId,
                    ...(callerCompany ? { companyName: callerCompany } : {}),
                },
                data: dataToUpdate,
            });
            return prisma.companyExpense.findUnique({ where: { id } });
        }

        if (payload.date !== undefined) {
            const d = new Date(payload.date);
            dataToUpdate.date = d;
            dataToUpdate.month = payload.month ? Number(payload.month) : d.getMonth() + 1;
            dataToUpdate.year = payload.year ? Number(payload.year) : d.getFullYear();
        } else {
            if (payload.month !== undefined) dataToUpdate.month = Number(payload.month);
            if (payload.year !== undefined) dataToUpdate.year = Number(payload.year);
        }

        return prisma.companyExpense.update({
            where: { id },
            data: dataToUpdate,
        });
    }

    async deleteCompanyExpense(
        id: string,
        params?: { deleteScope?: string; scope?: string },
        currentUser?: any,
    ) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller) {
                callerRole = caller.role;
                callerCompany = caller.companyName || null;
            }
        }

        const existing = await prisma.companyExpense.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new AppError("Xarajat topilmadi", 404);
        }

        if (
            callerCompany &&
            existing.companyName &&
            callerRole !== "SUPER_ADMIN" &&
            existing.companyName !== callerCompany
        ) {
            throw new AppError("Ruxsat berilmadi", 403);
        }

        const scope = params?.deleteScope || params?.scope;
        if (scope === "ALL_RECURRING" && existing.recurringGroupId) {
            await prisma.companyRecurringExpense.deleteMany({
                where: {
                    id: existing.recurringGroupId,
                    ...(callerCompany ? { companyName: callerCompany } : {}),
                },
            });
            return prisma.companyExpense.deleteMany({
                where: {
                    recurringGroupId: existing.recurringGroupId,
                    ...(callerCompany ? { companyName: callerCompany } : {}),
                },
            });
        }

        return prisma.companyExpense.delete({
            where: { id },
        });
    }

    async getCompanyExpensesAnalytics(query: { year?: number | string }, currentUser?: any) {
        let callerRole = currentUser?.role;
        let callerCompany: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                callerCompany = caller.companyName || null;
            } else if (caller && caller.role === "SUPER_ADMIN") {
                callerCompany = caller.companyName || null;
            }
        }

        await this.syncRecurringExpensesForCompany(callerCompany);

        const targetYear = Number(query.year) || new Date().getFullYear();

        
        const employees = await prisma.employee.findMany({
            where: {
                ...(callerCompany ? { user: { companyName: callerCompany } } : {}),
            },
            include: {
                user: { select: { id: true, email: true, companyName: true } },
                department: { select: { id: true, name: true } },
                position: { select: { id: true, title: true } },
            },
        });

        const employeeIds = employees.map((e) => e.id);
        const empMap = new Map<string, typeof employees[0]>();
        employees.forEach((e) => empMap.set(e.id, e));

        
        const payrolls = employeeIds.length > 0
            ? await prisma.payroll.findMany({
                where: {
                    year: targetYear,
                    employeeId: { in: employeeIds },
                    ...(callerCompany ? { companyName: callerCompany } : {}),
                },
                include: {
                    employee: {
                        include: {
                            department: true,
                            position: true,
                            user: { select: { companyName: true, email: true } },
                        },
                    },
                },
            })
            : [];

        
        const advances = employeeIds.length > 0
            ? await prisma.payrollAdvance.findMany({
                where: {
                    year: targetYear,
                    employeeId: { in: employeeIds },
                    ...(callerCompany ? { companyName: callerCompany } : {}),
                    status: { in: [PayrollStatus.PAID, PayrollStatus.AWAITING_CONFIRMATION] },
                },
                include: {
                    employee: {
                        include: {
                            department: true,
                            position: true,
                            user: { select: { companyName: true, email: true } },
                        },
                    },
                },
            })
            : [];

        
        const penalties = employeeIds.length > 0
            ? await prisma.employeePenalty.findMany({
                where: {
                    year: targetYear,
                    employeeId: { in: employeeIds },
                    ...(callerCompany ? { companyName: callerCompany } : {}),
                },
                include: {
                    rule: true,
                    employee: {
                        include: {
                            department: true,
                            position: true,
                        },
                    },
                },
            })
            : [];

        
        const manualExpenses = await prisma.companyExpense.findMany({
            where: {
                year: targetYear,
                ...(callerCompany ? { companyName: callerCompany } : {}),
            },
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        });

        const monthNamesUz = [
            "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
            "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
        ];

        const categoryLabels: Record<string, string> = {
            RENT: "Ofis ijarasi",
            UTILITIES: "Kommunal to'lovlar",
            SOFTWARE: "Dasturiy ta'minot & IT",
            OFFICE: "Ofis va kanselyariya",
            MARKETING: "Marketing & Reklama",
            HARDWARE: "Texnika va uskunalar",
            TRAVEL: "Xizmat safari & Transport",
            TAXES: "Soliqlar & Badallar",
            OTHER: "Boshqa xarajatlar",
        };

        
        const monthlyAnalytics: any[] = [];
        let yearlyTotalExpense = 0;
        let yearlyTotalBaseSalary = 0;
        let yearlyTotalBonuses = 0;
        let yearlyTotalAdvances = 0;
        let yearlyTotalPenalties = 0;
        let yearlyTotalNetSalary = 0;
        let yearlyTotalManualExpenses = 0;

        for (let m = 1; m <= 12; m++) {
            const mPayrolls = payrolls.filter((p) => p.month === m);
            const mAdvances = advances.filter((a) => a.month === m);
            const mPenalties = penalties.filter((p) => p.month === m);
            const mManual = manualExpenses.filter((e) => e.month === m);

            const mBaseSalary = mPayrolls.reduce((sum, p) => sum + (p.baseSalary || 0), 0);
            const mBonuses = mPayrolls.reduce((sum, p) => sum + (p.bonus || 0), 0);
            const mDeductions = mPayrolls.reduce((sum, p) => sum + (p.deductions || 0), 0);
            const mNetSalary = mPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
            const mAdvanceTotal = mAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);
            const mPenaltyTotal = mPenalties.reduce((sum, p) => sum + (p.amount || 0), 0);
            const mManualTotal = mManual.reduce((sum, e) => sum + (e.amount || 0), 0);

            
            
            const mTotalExpense = (mPayrolls.length > 0 ? mNetSalary : 0) + mAdvanceTotal + mManualTotal;

            yearlyTotalExpense += mTotalExpense;
            yearlyTotalBaseSalary += mBaseSalary;
            yearlyTotalBonuses += mBonuses;
            yearlyTotalAdvances += mAdvanceTotal;
            yearlyTotalPenalties += mPenaltyTotal;
            yearlyTotalNetSalary += mNetSalary;
            yearlyTotalManualExpenses += mManualTotal;

            
            const grossPositives = mBaseSalary + mBonuses + mAdvanceTotal + mManualTotal;
            const pctBaseSalary = grossPositives > 0 ? Math.round((mBaseSalary / grossPositives) * 1000) / 10 : 0;
            const pctBonuses = grossPositives > 0 ? Math.round((mBonuses / grossPositives) * 1000) / 10 : 0;
            const pctAdvances = grossPositives > 0 ? Math.round((mAdvanceTotal / grossPositives) * 1000) / 10 : 0;
            const pctManualExpenses = grossPositives > 0 ? Math.round((mManualTotal / grossPositives) * 1000) / 10 : 0;
            const pctPenalties = grossPositives > 0 ? Math.round((mPenaltyTotal / grossPositives) * 1000) / 10 : 0;

            
            const deptMap = new Map<string, {
                departmentId: string;
                departmentName: string;
                totalExpense: number;
                baseSalary: number;
                bonuses: number;
                advances: number;
                employeesCount: number;
                employeeIds: Set<string>;
            }>();

            mPayrolls.forEach((p) => {
                const deptName = p.employee?.department?.name || "Boshqa bo'lim";
                const deptId = p.employee?.department?.id || "other";
                if (!deptMap.has(deptId)) {
                    deptMap.set(deptId, {
                        departmentId: deptId,
                        departmentName: deptName,
                        totalExpense: 0,
                        baseSalary: 0,
                        bonuses: 0,
                        advances: 0,
                        employeesCount: 0,
                        employeeIds: new Set(),
                    });
                }
                const d = deptMap.get(deptId)!;
                d.totalExpense += (p.netSalary || 0);
                d.baseSalary += (p.baseSalary || 0);
                d.bonuses += (p.bonus || 0);
                d.employeeIds.add(p.employeeId);
            });

            mAdvances.forEach((a) => {
                const deptName = a.employee?.department?.name || "Boshqa bo'lim";
                const deptId = a.employee?.department?.id || "other";
                if (!deptMap.has(deptId)) {
                    deptMap.set(deptId, {
                        departmentId: deptId,
                        departmentName: deptName,
                        totalExpense: 0,
                        baseSalary: 0,
                        bonuses: 0,
                        advances: 0,
                        employeesCount: 0,
                        employeeIds: new Set(),
                    });
                }
                const d = deptMap.get(deptId)!;
                d.totalExpense += (a.amount || 0);
                d.advances += (a.amount || 0);
                d.employeeIds.add(a.employeeId);
            });

            const departmentBreakdown = Array.from(deptMap.values()).map((d) => ({
                departmentId: d.departmentId,
                departmentName: d.departmentName,
                totalExpense: d.totalExpense,
                baseSalary: d.baseSalary,
                bonuses: d.bonuses,
                advances: d.advances,
                employeesCount: d.employeeIds.size,
                percentage: mTotalExpense > 0 ? Math.round((d.totalExpense / mTotalExpense) * 1000) / 10 : 0,
            })).sort((a, b) => b.totalExpense - a.totalExpense);

            
            const catMap = new Map<string, { category: string; categoryName: string; totalAmount: number; count: number }>();
            mManual.forEach((exp) => {
                const c = exp.category || "OTHER";
                if (!catMap.has(c)) {
                    catMap.set(c, {
                        category: c,
                        categoryName: categoryLabels[c] || c,
                        totalAmount: 0,
                        count: 0,
                    });
                }
                const item = catMap.get(c)!;
                item.totalAmount += (exp.amount || 0);
                item.count += 1;
            });

            const manualExpensesByCategory = Array.from(catMap.values()).map((c) => ({
                category: c.category,
                categoryName: c.categoryName,
                totalAmount: c.totalAmount,
                count: c.count,
                percentage: mManualTotal > 0 ? Math.round((c.totalAmount / mManualTotal) * 1000) / 10 : 0,
            })).sort((a, b) => b.totalAmount - a.totalAmount);

            
            const empDetailMap = new Map<string, any>();
            mPayrolls.forEach((p) => {
                empDetailMap.set(p.employeeId, {
                    employeeId: p.employeeId,
                    name: `${p.employee?.firstName || ""} ${p.employee?.lastName || ""}`.trim(),
                    email: p.employee?.user?.email || "",
                    department: p.employee?.department?.name || "-",
                    position: p.employee?.position?.title || "-",
                    baseSalary: p.baseSalary || 0,
                    bonus: p.bonus || 0,
                    deductions: p.deductions || 0,
                    netSalary: p.netSalary || 0,
                    advances: 0,
                    totalExpense: p.netSalary || 0,
                });
            });

            mAdvances.forEach((a) => {
                if (empDetailMap.has(a.employeeId)) {
                    const item = empDetailMap.get(a.employeeId);
                    item.advances += (a.amount || 0);
                    item.totalExpense += (a.amount || 0);
                } else {
                    const emp = empMap.get(a.employeeId);
                    empDetailMap.set(a.employeeId, {
                        employeeId: a.employeeId,
                        name: `${emp?.firstName || ""} ${emp?.lastName || ""}`.trim(),
                        email: emp?.user?.email || "",
                        department: emp?.department?.name || "-",
                        position: emp?.position?.title || "-",
                        baseSalary: 0,
                        bonus: 0,
                        deductions: 0,
                        netSalary: 0,
                        advances: a.amount || 0,
                        totalExpense: a.amount || 0,
                    });
                }
            });

            const employeeList = Array.from(empDetailMap.values()).sort((a, b) => b.totalExpense - a.totalExpense);

            monthlyAnalytics.push({
                month: m,
                monthName: monthNamesUz[m - 1],
                year: targetYear,
                totalExpense: mTotalExpense,
                baseSalary: mBaseSalary,
                bonuses: mBonuses,
                deductions: mDeductions,
                netSalary: mNetSalary,
                advances: mAdvanceTotal,
                manualExpenses: mManualTotal,
                penalties: mPenaltyTotal,
                payrollCount: mPayrolls.length,
                advancesCount: mAdvances.length,
                manualExpensesCount: mManual.length,
                activeEmployeesCount: employeeList.length,
                percentages: {
                    baseSalary: pctBaseSalary,
                    bonuses: pctBonuses,
                    advances: pctAdvances,
                    manualExpenses: pctManualExpenses,
                    penalties: pctPenalties,
                },
                departmentBreakdown,
                manualExpensesByCategory,
                manualExpensesList: mManual,
                employeeList,
            });
        }

        
        const activeMonths = monthlyAnalytics.filter((m) => m.totalExpense > 0);
        let maxExpenseMonth: any = null;
        let minExpenseMonth: any = null;

        if (activeMonths.length > 0) {
            maxExpenseMonth = activeMonths.reduce((prev, curr) => (curr.totalExpense > prev.totalExpense ? curr : prev), activeMonths[0]);
            minExpenseMonth = activeMonths.reduce((prev, curr) => (curr.totalExpense < prev.totalExpense ? curr : prev), activeMonths[0]);
        } else {
            maxExpenseMonth = monthlyAnalytics[0];
            minExpenseMonth = monthlyAnalytics[0];
        }

        const activeMonthsCount = activeMonths.length > 0 ? activeMonths.length : 1;
        const averageMonthlyExpense = Math.round(yearlyTotalExpense / activeMonthsCount);

        return {
            companyName: callerCompany || "Asosiy Kompaniya",
            year: targetYear,
            yearlyTotalExpense,
            yearlyTotalBaseSalary,
            yearlyTotalBonuses,
            yearlyTotalAdvances,
            yearlyTotalManualExpenses,
            yearlyTotalPenalties,
            yearlyTotalNetSalary,
            averageMonthlyExpense,
            totalEmployeesCount: employees.length,
            maxExpenseMonth: maxExpenseMonth ? {
                month: maxExpenseMonth.month,
                monthName: maxExpenseMonth.monthName,
                totalExpense: maxExpenseMonth.totalExpense,
                percentageOfYear: yearlyTotalExpense > 0 ? Math.round((maxExpenseMonth.totalExpense / yearlyTotalExpense) * 1000) / 10 : 0,
            } : null,
            minExpenseMonth: minExpenseMonth ? {
                month: minExpenseMonth.month,
                monthName: minExpenseMonth.monthName,
                totalExpense: minExpenseMonth.totalExpense,
                percentageOfYear: yearlyTotalExpense > 0 ? Math.round((minExpenseMonth.totalExpense / yearlyTotalExpense) * 1000) / 10 : 0,
            } : null,
            monthlyAnalytics,
        };
    }
}

export const payrollService = new PayrollService();

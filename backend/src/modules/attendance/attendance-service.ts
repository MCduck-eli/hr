import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { calculateDistanceInMeters } from "../../utils/geofence.util";
import { AttendanceStatus } from "@prisma/client";
import { notificationService } from "../notification/notification-service";

export class AttendanceService {
    async getAllWorkSchedules() {
        let schedules = await prisma.workSchedule.findMany({
            orderBy: { createdAt: "desc" },
        });

        if (schedules.length === 0) {
            const def = await prisma.workSchedule.create({
                data: {
                    name: "Standart Ish Jadvali (Barchasi uchun)",
                    startTime: "09:00",
                    endTime: "18:00",
                    workingDays: [1, 2, 3, 4, 5],
                    gracePeriodMinutes: 15,
                    isDefault: true,
                },
            });
            schedules = [def];
        }

        const departments = await prisma.department.findMany({
            select: { id: true, name: true },
        });
        const employees = await prisma.employee.findMany({
            where: {
                user: { role: { notIn: ["SUPER_ADMIN", "DIRECTOR"] } },
            },
            select: { id: true, firstName: true, lastName: true },
        });

        const deptMap = new Map(departments.map((d) => [d.id, d.name]));
        const empMap = new Map(
            employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]),
        );

        return schedules.map((s) => ({
            ...s,
            departmentName: s.departmentId ? deptMap.get(s.departmentId) || null : null,
            employeeName: s.employeeId ? empMap.get(s.employeeId) || null : null,
        }));
    }

    async getWorkSchedule() {
        let schedule = await prisma.workSchedule.findFirst({
            where: { isDefault: true },
        });

        if (!schedule) {
            schedule = await prisma.workSchedule.create({
                data: {
                    name: "Standart Ish Jadvali",
                    startTime: "09:00",
                    endTime: "18:00",
                    workingDays: [1, 2, 3, 4, 5],
                    gracePeriodMinutes: 15,
                    isDefault: true,
                },
            });
        }

        return schedule;
    }

    async createWorkSchedule(payload: {
        name: string;
        startTime: string;
        endTime: string;
        workingDays: number[];
        gracePeriodMinutes?: number;
        departmentId?: string | null;
        employeeId?: string | null;
        isDefault?: boolean;
    }) {
        const isDefault =
            Boolean(payload.isDefault) ||
            (!payload.departmentId && !payload.employeeId);

        if (isDefault) {
            await prisma.workSchedule.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }

        return prisma.workSchedule.create({
            data: {
                name: payload.name,
                startTime: payload.startTime,
                endTime: payload.endTime,
                workingDays: payload.workingDays,
                gracePeriodMinutes: Number(payload.gracePeriodMinutes || 15),
                departmentId: payload.departmentId || null,
                employeeId: payload.employeeId || null,
                isDefault,
            },
        });
    }

    async updateWorkSchedule(payload: {
        id?: string;
        startTime?: string;
        endTime?: string;
        workingDays?: number[];
        gracePeriodMinutes?: number;
        name?: string;
        departmentId?: string | null;
        employeeId?: string | null;
        isDefault?: boolean;
    }) {
        let scheduleId = payload.id;
        if (!scheduleId) {
            const def = await this.getWorkSchedule();
            scheduleId = def.id;
        }

        if (payload.isDefault) {
            await prisma.workSchedule.updateMany({
                where: { isDefault: true, id: { not: scheduleId } },
                data: { isDefault: false },
            });
        }

        return prisma.workSchedule.update({
            where: { id: scheduleId },
            data: {
                ...(payload.name && { name: payload.name }),
                ...(payload.startTime && { startTime: payload.startTime }),
                ...(payload.endTime && { endTime: payload.endTime }),
                ...(payload.workingDays && { workingDays: payload.workingDays }),
                ...(payload.gracePeriodMinutes !== undefined && {
                    gracePeriodMinutes: Number(payload.gracePeriodMinutes),
                }),
                ...(payload.departmentId !== undefined && {
                    departmentId: payload.departmentId,
                }),
                ...(payload.employeeId !== undefined && {
                    employeeId: payload.employeeId,
                }),
                ...(payload.isDefault !== undefined && {
                    isDefault: payload.isDefault,
                }),
            },
        });
    }

    async deleteWorkSchedule(id: string) {
        const schedule = await prisma.workSchedule.findUnique({
            where: { id },
        });
        if (!schedule) {
            throw new AppError("Jadval topilmadi", 404);
        }

        if (schedule.isDefault) {
            const other = await prisma.workSchedule.findFirst({
                where: { id: { not: id } },
            });
            if (other) {
                await prisma.workSchedule.update({
                    where: { id: other.id },
                    data: { isDefault: true },
                });
            }
        }

        return prisma.workSchedule.delete({
            where: { id },
        });
    }

    async getEffectiveScheduleForEmployee(
        employeeId: string,
        departmentId?: string | null,
    ) {
        const schedules = await prisma.workSchedule.findMany();

        const empSchedule = schedules.find((s) => s.employeeId === employeeId);
        if (empSchedule) return empSchedule;

        if (departmentId) {
            const deptSchedule = schedules.find(
                (s) => s.departmentId === departmentId,
            );
            if (deptSchedule) return deptSchedule;
        }

        const defaultSchedule = schedules.find((s) => s.isDefault);
        if (defaultSchedule) return defaultSchedule;

        return {
            id: "fallback",
            name: "Standart Ish Jadvali",
            startTime: "09:00",
            endTime: "18:00",
            workingDays: [1, 2, 3, 4, 5],
            gracePeriodMinutes: 15,
            isDefault: true,
        };
    }

    private async resolveEmployee(rawUserId: string) {
        let employee = await prisma.employee.findFirst({
            where: {
                OR: [{ userId: rawUserId }, { id: rawUserId }],
            },
            include: { department: true, position: true, user: true },
        });

        if (!employee) {
            const user = await prisma.user.findUnique({
                where: { id: rawUserId },
            });
            if (user) {
                employee = await prisma.employee.create({
                    data: {
                        userId: user.id,
                        firstName: user.firstName || "Xodim",
                        lastName: user.lastName || "",
                        status: "NEW",
                    },
                    include: { department: true, position: true, user: true },
                });
            }
        }

        if (!employee) {
            throw new AppError("Xodim profili topilmadi", 404);
        }

        return employee;
    }

    async checkIn(rawUserId: string, note?: string, image?: string) {
        const employee = await this.resolveEmployee(rawUserId);
        const schedule = await this.getEffectiveScheduleForEmployee(
            employee.id,
            employee.departmentId,
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingAttendance = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: employee.id,
                    date: today,
                },
            },
        });

        if (existingAttendance && existingAttendance.checkIn) {
            throw new AppError("Bugun allaqachon Check In qilingan", 400);
        }

        const now = new Date();
        const [startHour, startMinute] = (schedule.startTime || "09:00")
            .split(":")
            .map(Number);
        const targetStartTime = new Date(today);
        targetStartTime.setHours(startHour, startMinute, 0, 0);

        const targetGraceTime = new Date(
            targetStartTime.getTime() +
                (schedule.gracePeriodMinutes || 15) * 60 * 1000,
        );

        let lateMinutes = 0;
        let status: AttendanceStatus = "PRESENT";

        if (now.getTime() > targetGraceTime.getTime()) {
            lateMinutes = Math.max(
                0,
                Math.floor(
                    (now.getTime() - targetStartTime.getTime()) / (1000 * 60),
                ),
            );
            status = "LATE";
        }

        const finalNote = note || "Face ID orqali qayd etildi";

        let result;
        if (existingAttendance) {
            result = await prisma.attendance.update({
                where: { id: existingAttendance.id },
                data: {
                    checkIn: now,
                    status,
                    lateMinutes,
                    note: finalNote,
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            department: true,
                            position: true,
                        },
                    },
                },
            });
        } else {
            result = await prisma.attendance.create({
                data: {
                    employeeId: employee.id,
                    date: today,
                    checkIn: now,
                    status,
                    lateMinutes,
                    note: finalNote,
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            department: true,
                            position: true,
                        },
                    },
                },
            });
        }

        const timeStr = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        const formattedLate =
            lateMinutes >= 60
                ? `${Math.floor(lateMinutes / 60)} soat ${lateMinutes % 60 > 0 ? `${lateMinutes % 60} daqiqa ` : ""}kechikdi`
                : `${lateMinutes} daqiqa kechikdi`;
        const statusLabel =
            status === "LATE" ? formattedLate : "Vaqtida keldi";

        const empUser = employee.userId
            ? await prisma.user.findUnique({
                  where: { id: employee.userId },
                  select: { companyName: true },
              })
            : null;

        try {
            await notificationService.notifyAllUsers({
                title: `Xodim Keldi (${employee.firstName} ${employee.lastName})`,
                message: `${employee.firstName} ${employee.lastName} soat ${timeStr} da Face ID orqali davomatni qayd etdi (${statusLabel}). Kutilgan vaqt: ${schedule.startTime}`,
                type: "GENERAL",
                excludeUserId: employee.userId,
                targetRoles: ["DIRECTOR", "HR_ADMIN"],
                companyName: empUser?.companyName || undefined,
                metadata: {
                    type: "ATTENDANCE",
                    employeeId: employee.id,
                    link: "/hr/attendance",
                },
            });
        } catch (e) {}

        return result;
    }

    async checkOut(rawUserId: string, note?: string) {
        const employee = await this.resolveEmployee(rawUserId);
        const schedule = await this.getEffectiveScheduleForEmployee(
            employee.id,
            employee.departmentId,
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: employee.id,
                    date: today,
                },
            },
        });

        if (!attendance || !attendance.checkIn) {
            throw new AppError("Avval Check In qilishingiz kerak", 400);
        }

        if (attendance.checkOut) {
            throw new AppError("Bugun allaqachon Check Out qilingan", 400);
        }

        const now = new Date();
        const [endHour, endMinute] = (schedule.endTime || "18:00")
            .split(":")
            .map(Number);
        const targetEndTime = new Date(today);
        targetEndTime.setHours(endHour, endMinute, 0, 0);

        let earlyMinutes = 0;
        if (now.getTime() < targetEndTime.getTime()) {
            earlyMinutes = Math.max(
                0,
                Math.floor(
                    (targetEndTime.getTime() - now.getTime()) / (1000 * 60),
                ),
            );
        }

        const finalNote = note
            ? attendance.note
                ? `${attendance.note} | ${note}`
                : note
            : attendance.note;

        const result = await prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                checkOut: now,
                earlyMinutes,
                note: finalNote,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                        position: true,
                    },
                },
            },
        });

        const timeStr = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        const formattedEarly =
            earlyMinutes >= 60
                ? `${Math.floor(earlyMinutes / 60)} soat ${earlyMinutes % 60 > 0 ? `${earlyMinutes % 60} daqiqa ` : ""}erta ketdi`
                : `${earlyMinutes} daqiqa erta ketdi`;
        const earlyLabel =
            earlyMinutes > 0 ? ` (${formattedEarly})` : "";

        const empUser = employee.userId
            ? await prisma.user.findUnique({
                  where: { id: employee.userId },
                  select: { companyName: true },
              })
            : null;

        try {
            await notificationService.notifyAllUsers({
                title: `Xodim Ketdi (${employee.firstName} ${employee.lastName})`,
                message: `${employee.firstName} ${employee.lastName} soat ${timeStr} da ishdan chiqishni (Check Out) qayd etdi${earlyLabel}. Kutilgan vaqt: ${schedule.endTime}`,
                type: "GENERAL",
                excludeUserId: employee.userId,
                targetRoles: ["DIRECTOR", "HR_ADMIN"],
                companyName: empUser?.companyName || undefined,
                metadata: {
                    type: "ATTENDANCE",
                    employeeId: employee.id,
                    link: "/hr/attendance",
                },
            });
        } catch (e) {}

        return result;
    }

    async submitAbsenceReason(
        rawUserId: string,
        payload: {
            employeeId?: string;
            date?: string;
            reason: string;
            submittedBy?: string;
        },
    ) {
        let targetEmployeeId = payload.employeeId;

        if (!targetEmployeeId) {
            const employee = await this.resolveEmployee(rawUserId);
            targetEmployeeId = employee.id;
        }

        const targetDate = payload.date ? new Date(payload.date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const existing = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: targetEmployeeId,
                    date: targetDate,
                },
            },
        });

        const submittedBy = payload.submittedBy || "HR";

        if (existing) {
            return prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    absenceReason: payload.reason,
                    reasonSubmittedBy: submittedBy,
                    status: existing.checkIn ? existing.status : "ABSENT",
                    note: existing.note
                        ? `${existing.note} | Sabab: ${payload.reason}`
                        : `Sabab: ${payload.reason}`,
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });
        }

        return prisma.attendance.create({
            data: {
                employeeId: targetEmployeeId,
                date: targetDate,
                status: "ABSENT",
                absenceReason: payload.reason,
                reasonSubmittedBy: submittedBy,
                note: `Sabab: ${payload.reason}`,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async getTodayStatus(rawUserId: string) {
        const employee = await this.resolveEmployee(rawUserId);
        const schedule = await this.getEffectiveScheduleForEmployee(
            employee.id,
            employee.departmentId,
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
        const isWorkingDay = (schedule.workingDays || [1, 2, 3, 4, 5]).includes(
            dayOfWeek,
        );

        const attendance = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: employee.id,
                    date: today,
                },
            },
        });

        const attendanceHours = await this.calculateEmployeeHours(employee.id);

        return {
            isCheckedIn: Boolean(attendance?.checkIn),
            isCheckedOut: Boolean(attendance?.checkOut),
            checkInTime: attendance?.checkIn
                ? attendance.checkIn.toISOString()
                : null,
            checkOutTime: attendance?.checkOut
                ? attendance.checkOut.toISOString()
                : null,
            expectedCheckIn: schedule.startTime || "09:00",
            expectedCheckOut: schedule.endTime || "18:00",
            lateMinutes: attendance?.lateMinutes || 0,
            earlyMinutes: attendance?.earlyMinutes || 0,
            absenceReason: attendance?.absenceReason || null,
            status:
                attendance?.status ||
                (isWorkingDay ? "BELGILANMADI" : "DAM_OLISH"),
            isWorkingDay,
            attendanceHours,
            schedule: {
                name: schedule.name,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                workingDays: schedule.workingDays,
                gracePeriodMinutes: schedule.gracePeriodMinutes,
            },
            employeeName: `${employee.firstName} ${employee.lastName}`,
            date: today.toISOString(),
        };
    }

    async calculateEmployeeHours(employeeId: string): Promise<number> {
        const attendances = await prisma.attendance.findMany({
            where: { employeeId },
            orderBy: { date: "desc" },
        });

        let totalMs = 0;
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const att of attendances) {
            if (att.checkIn && att.checkOut) {
                totalMs += att.checkOut.getTime() - att.checkIn.getTime();
            } else if (att.checkIn && att.date.getTime() === today.getTime()) {
                totalMs += Math.max(0, now.getTime() - att.checkIn.getTime());
            } else if (att.checkIn) {
                totalMs += 8 * 60 * 60 * 1000;
            }
        }

        return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
    }

    async getAllAttendance(
        query: {
            startDate?: string;
            endDate?: string;
            employeeId?: string;
            search?: string;
        },
        currentUser?: any,
    ) {
        const schedules = await prisma.workSchedule.findMany();
        const defaultSchedule = schedules.find((s) => s.isDefault) || {
            id: "default",
            name: "Standart Ish Jadvali",
            startTime: "09:00",
            endTime: "18:00",
            workingDays: [1, 2, 3, 4, 5],
            gracePeriodMinutes: 15,
            isDefault: true,
        };

        const selectedDate = query.startDate
            ? new Date(query.startDate)
            : new Date();
        selectedDate.setHours(0, 0, 0, 0);

        const dayOfWeek =
            selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();

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

        const whereEmployee: any = {
            user: {
                role: { notIn: ["SUPER_ADMIN", "DIRECTOR"] },
                ...(companyFilter ? { companyName: companyFilter } : {}),
            },
        };

        if (query.employeeId) {
            whereEmployee.id = query.employeeId;
        }

        if (query.search) {
            whereEmployee.OR = [
                { firstName: { contains: query.search, mode: "insensitive" } },
                { lastName: { contains: query.search, mode: "insensitive" } },
            ];
        }

        const [allEmployees, attendancesForDate] = await Promise.all([
            prisma.employee.findMany({
                where: whereEmployee,
                include: {
                    department: { select: { id: true, name: true } },
                    position: { select: { id: true, title: true } },
                    user: { select: { email: true } },
                },
                orderBy: { firstName: "asc" },
            }),
            prisma.attendance.findMany({
                where: {
                    date: selectedDate,
                    ...(query.employeeId ? { employeeId: query.employeeId } : {}),
                },
            }),
        ]);

        const attendanceMap = new Map<string, any>();
        attendancesForDate.forEach((att) => {
            attendanceMap.set(att.employeeId, att);
        });

        let todayPresent = 0;
        let todayLate = 0;
        let todayEarly = 0;
        let todayCheckedInTotal = 0;
        let todayCheckedOut = 0;
        let todayUnmarked = 0;
        let todayReasonGiven = 0;

        const records = allEmployees.map((emp) => {
            const att = attendanceMap.get(emp.id);

            const empSchedule =
                schedules.find((s) => s.employeeId === emp.id) ||
                (emp.departmentId
                    ? schedules.find((s) => s.departmentId === emp.departmentId)
                    : null) ||
                defaultSchedule;

            const isEmpWorkingDay = (
                empSchedule.workingDays || [1, 2, 3, 4, 5]
            ).includes(dayOfWeek);

            let durationHours: number | null = null;
            if (att?.checkIn && att?.checkOut) {
                durationHours =
                    Math.round(
                        ((att.checkOut.getTime() - att.checkIn.getTime()) /
                            (1000 * 60 * 60)) *
                            10,
                    ) / 10;
            } else if (att?.checkIn) {
                const now = new Date();
                durationHours =
                    Math.round(
                        ((now.getTime() - att.checkIn.getTime()) /
                            (1000 * 60 * 60)) *
                            10,
                    ) / 10;
            }

            let displayStatus: string;
            if (att?.checkIn) {
                displayStatus = att.status;
                todayCheckedInTotal++;
                if (att.status === "LATE") todayLate++;
                else todayPresent++;
                if (att.checkOut) todayCheckedOut++;
                if (att.earlyMinutes && att.earlyMinutes > 0) todayEarly++;
            } else if (att?.absenceReason) {
                displayStatus = "SABABLI";
                todayReasonGiven++;
            } else if (!isEmpWorkingDay) {
                displayStatus = "DAM_OLISH";
            } else {
                displayStatus = "BELGILANMADI";
                todayUnmarked++;
            }

            return {
                id: att?.id || `emp-${emp.id}`,
                employeeId: emp.id,
                date: selectedDate.toISOString(),
                expectedCheckIn: empSchedule.startTime || "09:00",
                expectedCheckOut: empSchedule.endTime || "18:00",
                scheduleName: empSchedule.name || "Standart Ish Jadvali",
                checkIn: att?.checkIn ? att.checkIn.toISOString() : null,
                checkOut: att?.checkOut ? att.checkOut.toISOString() : null,
                lateMinutes: att?.lateMinutes || 0,
                earlyMinutes: att?.earlyMinutes || 0,
                absenceReason: att?.absenceReason || null,
                reasonSubmittedBy: att?.reasonSubmittedBy || null,
                status: displayStatus,
                note: att?.note || null,
                durationHours,
                isWorkingDay: isEmpWorkingDay,
                employee: {
                    id: emp.id,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    department: emp.department,
                    position: emp.position,
                    user: emp.user,
                },
            };
        });

        const isDefaultWorkingDay = (
            defaultSchedule.workingDays || [1, 2, 3, 4, 5]
        ).includes(dayOfWeek);

        return {
            records,
            summary: {
                totalEmployees: allEmployees.length,
                todayPresent,
                todayLate,
                todayEarly,
                todayCheckedInTotal,
                todayCheckedOut,
                todayUnmarked,
                todayReasonGiven,
                isWorkingDay: isDefaultWorkingDay,
            },
            schedule: defaultSchedule,
        };
    }

    async getMobileDashboardData(rawUserId: string) {
        const employee = await this.resolveEmployee(rawUserId);

        const recentAttendances = await prisma.attendance.findMany({
            where: { employeeId: employee.id },
            orderBy: { date: "desc" },
            take: 10,
        });

        return {
            employee,
            recentAttendances,
        };
    }
}

export const attendanceService = new AttendanceService();

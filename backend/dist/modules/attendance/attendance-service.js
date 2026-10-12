"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceService = exports.AttendanceService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
const notification_service_1 = require("../notification/notification-service");
class AttendanceService {
    async getAllWorkSchedules() {
        let schedules = await db_1.default.workSchedule.findMany({
            orderBy: { createdAt: "desc" },
        });
        if (schedules.length === 0) {
            const def = await db_1.default.workSchedule.create({
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
        const departments = await db_1.default.department.findMany({
            select: { id: true, name: true },
        });
        const employees = await db_1.default.employee.findMany({
            where: {
                status: { not: "TERMINATED" },
                user: { role: { notIn: ["SUPER_ADMIN", "DIRECTOR"] } },
            },
            select: { id: true, firstName: true, lastName: true },
        });
        const deptMap = new Map(departments.map((d) => [d.id, d.name]));
        const empMap = new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]));
        return schedules.map((s) => ({
            ...s,
            departmentName: s.departmentId ? deptMap.get(s.departmentId) || null : null,
            employeeName: s.employeeId ? empMap.get(s.employeeId) || null : null,
        }));
    }
    async getWorkSchedule() {
        let schedule = await db_1.default.workSchedule.findFirst({
            where: { isDefault: true },
        });
        if (!schedule) {
            schedule = await db_1.default.workSchedule.create({
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
    async createWorkSchedule(payload) {
        const isDefault = Boolean(payload.isDefault) ||
            (!payload.departmentId && !payload.employeeId);
        if (isDefault) {
            await db_1.default.workSchedule.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }
        return db_1.default.workSchedule.create({
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
    async updateWorkSchedule(payload) {
        let scheduleId = payload.id;
        if (!scheduleId) {
            const def = await this.getWorkSchedule();
            scheduleId = def.id;
        }
        if (payload.isDefault) {
            await db_1.default.workSchedule.updateMany({
                where: { isDefault: true, id: { not: scheduleId } },
                data: { isDefault: false },
            });
        }
        return db_1.default.workSchedule.update({
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
    async deleteWorkSchedule(id) {
        const schedule = await db_1.default.workSchedule.findUnique({
            where: { id },
        });
        if (!schedule) {
            throw new appError_1.AppError("Jadval topilmadi", 404);
        }
        if (schedule.isDefault) {
            const other = await db_1.default.workSchedule.findFirst({
                where: { id: { not: id } },
            });
            if (other) {
                await db_1.default.workSchedule.update({
                    where: { id: other.id },
                    data: { isDefault: true },
                });
            }
        }
        return db_1.default.workSchedule.delete({
            where: { id },
        });
    }
    async getEffectiveScheduleForEmployee(employeeId, departmentId) {
        const schedules = await db_1.default.workSchedule.findMany();
        const empSchedule = schedules.find((s) => s.employeeId === employeeId);
        if (empSchedule)
            return empSchedule;
        if (departmentId) {
            const deptSchedule = schedules.find((s) => s.departmentId === departmentId);
            if (deptSchedule)
                return deptSchedule;
        }
        const defaultSchedule = schedules.find((s) => s.isDefault);
        if (defaultSchedule)
            return defaultSchedule;
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
    async resolveEmployee(rawUserId) {
        let employee = await db_1.default.employee.findFirst({
            where: {
                OR: [{ userId: rawUserId }, { id: rawUserId }],
            },
            include: { department: true, position: true, user: true },
        });
        if (!employee) {
            const user = await db_1.default.user.findUnique({
                where: { id: rawUserId },
            });
            if (user) {
                employee = await db_1.default.employee.create({
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
            throw new appError_1.AppError("Xodim profili topilmadi", 404);
        }
        return employee;
    }
    async checkIn(rawUserId, note, image) {
        const employee = await this.resolveEmployee(rawUserId);
        const schedule = await this.getEffectiveScheduleForEmployee(employee.id, employee.departmentId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existingAttendance = await db_1.default.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: employee.id,
                    date: today,
                },
            },
        });
        if (existingAttendance && existingAttendance.checkIn) {
            throw new appError_1.AppError("Bugun allaqachon Check In qilingan", 400);
        }
        const now = new Date();
        const [startHour, startMinute] = (schedule.startTime || "09:00")
            .split(":")
            .map(Number);
        const targetStartTime = new Date(today);
        targetStartTime.setHours(startHour, startMinute, 0, 0);
        const targetGraceTime = new Date(targetStartTime.getTime() +
            (schedule.gracePeriodMinutes || 15) * 60 * 1000);
        let lateMinutes = 0;
        let status = "PRESENT";
        if (now.getTime() > targetGraceTime.getTime()) {
            lateMinutes = Math.max(0, Math.floor((now.getTime() - targetStartTime.getTime()) / (1000 * 60)));
            status = "LATE";
        }
        const finalNote = note || "Face ID orqali qayd etildi";
        let result;
        if (existingAttendance) {
            result = await db_1.default.attendance.update({
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
        }
        else {
            result = await db_1.default.attendance.create({
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
        const formattedLate = lateMinutes >= 60
            ? `${Math.floor(lateMinutes / 60)} soat ${lateMinutes % 60 > 0 ? `${lateMinutes % 60} daqiqa ` : ""}kechikdi`
            : `${lateMinutes} daqiqa kechikdi`;
        const statusLabel = status === "LATE" ? formattedLate : "Vaqtida keldi";
        const empUser = employee.userId
            ? await db_1.default.user.findUnique({
                where: { id: employee.userId },
                select: { companyName: true },
            })
            : null;
        try {
            await notification_service_1.notificationService.notifyAllUsers({
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
        }
        catch (e) { }
        return result;
    }
    async checkOut(rawUserId, note) {
        const employee = await this.resolveEmployee(rawUserId);
        const schedule = await this.getEffectiveScheduleForEmployee(employee.id, employee.departmentId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const attendance = await db_1.default.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: employee.id,
                    date: today,
                },
            },
        });
        if (!attendance || !attendance.checkIn) {
            throw new appError_1.AppError("Avval Check In qilishingiz kerak", 400);
        }
        if (attendance.checkOut) {
            throw new appError_1.AppError("Bugun allaqachon Check Out qilingan", 400);
        }
        const now = new Date();
        const [endHour, endMinute] = (schedule.endTime || "18:00")
            .split(":")
            .map(Number);
        const targetEndTime = new Date(today);
        targetEndTime.setHours(endHour, endMinute, 0, 0);
        let earlyMinutes = 0;
        if (now.getTime() < targetEndTime.getTime()) {
            earlyMinutes = Math.max(0, Math.floor((targetEndTime.getTime() - now.getTime()) / (1000 * 60)));
        }
        const finalNote = note
            ? attendance.note
                ? `${attendance.note} | ${note}`
                : note
            : attendance.note;
        const result = await db_1.default.attendance.update({
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
        const formattedEarly = earlyMinutes >= 60
            ? `${Math.floor(earlyMinutes / 60)} soat ${earlyMinutes % 60 > 0 ? `${earlyMinutes % 60} daqiqa ` : ""}erta ketdi`
            : `${earlyMinutes} daqiqa erta ketdi`;
        const earlyLabel = earlyMinutes > 0 ? ` (${formattedEarly})` : "";
        const empUser = employee.userId
            ? await db_1.default.user.findUnique({
                where: { id: employee.userId },
                select: { companyName: true },
            })
            : null;
        try {
            await notification_service_1.notificationService.notifyAllUsers({
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
        }
        catch (e) { }
        return result;
    }
    async submitAbsenceReason(rawUserId, payload) {
        let targetEmployeeId = payload.employeeId;
        if (!targetEmployeeId) {
            const employee = await this.resolveEmployee(rawUserId);
            targetEmployeeId = employee.id;
        }
        const targetDate = payload.date ? new Date(payload.date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        const existing = await db_1.default.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: targetEmployeeId,
                    date: targetDate,
                },
            },
        });
        const submittedBy = payload.submittedBy || "HR";
        if (existing) {
            return db_1.default.attendance.update({
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
        return db_1.default.attendance.create({
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
    async getTodayStatus(rawUserId) {
        const employee = await this.resolveEmployee(rawUserId);
        const schedule = await this.getEffectiveScheduleForEmployee(employee.id, employee.departmentId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
        const isWorkingDay = (schedule.workingDays || [1, 2, 3, 4, 5]).includes(dayOfWeek);
        const attendance = await db_1.default.attendance.findUnique({
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
            status: attendance?.status ||
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
    async calculateEmployeeHours(employeeId) {
        const attendances = await db_1.default.attendance.findMany({
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
            }
            else if (att.checkIn && att.date.getTime() === today.getTime()) {
                totalMs += Math.max(0, now.getTime() - att.checkIn.getTime());
            }
            else if (att.checkIn) {
                totalMs += 8 * 60 * 60 * 1000;
            }
        }
        return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
    }
    async cleanupOldAttendances() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        cutoffDate.setHours(0, 0, 0, 0);
        await db_1.default.attendance.deleteMany({
            where: {
                date: { lt: cutoffDate },
            },
        }).catch(() => { });
    }
    async getAllAttendance(query, currentUser) {
        this.cleanupOldAttendances().catch(() => { });
        const schedules = await db_1.default.workSchedule.findMany();
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
        const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
        let companyFilter = null;
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }
        const whereEmployee = {
            status: { not: "TERMINATED" },
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
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
        threeMonthsAgo.setHours(0, 0, 0, 0);
        const [allEmployees, attendancesForDate, allPastAttendances, allPastLeaves] = await Promise.all([
            db_1.default.employee.findMany({
                where: whereEmployee,
                include: {
                    department: { select: { id: true, name: true } },
                    position: { select: { id: true, title: true } },
                    user: { select: { email: true, createdAt: true } },
                },
                orderBy: { firstName: "asc" },
            }),
            db_1.default.attendance.findMany({
                where: {
                    date: selectedDate,
                    ...(query.employeeId ? { employeeId: query.employeeId } : {}),
                },
            }),
            db_1.default.attendance.findMany({
                where: {
                    date: { gte: threeMonthsAgo },
                    ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
                    ...(query.employeeId ? { employeeId: query.employeeId } : {}),
                },
                orderBy: { date: "desc" },
            }),
            db_1.default.leaveRequest.findMany({
                where: {
                    status: "APPROVED",
                    endDate: { gte: threeMonthsAgo },
                    ...(companyFilter ? { employee: { user: { companyName: companyFilter } } } : {}),
                    ...(query.employeeId ? { employeeId: query.employeeId } : {}),
                },
            }),
        ]);
        const attendanceMap = new Map();
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
            const empSchedule = schedules.find((s) => s.employeeId === emp.id) ||
                (emp.departmentId
                    ? schedules.find((s) => s.departmentId === emp.departmentId)
                    : null) ||
                defaultSchedule;
            const isEmpWorkingDay = (empSchedule.workingDays || [1, 2, 3, 4, 5]).includes(dayOfWeek);
            let durationHours = null;
            if (att?.checkIn && att?.checkOut) {
                durationHours =
                    Math.round(((att.checkOut.getTime() - att.checkIn.getTime()) /
                        (1000 * 60 * 60)) *
                        10) / 10;
            }
            else if (att?.checkIn) {
                const now = new Date();
                durationHours =
                    Math.round(((now.getTime() - att.checkIn.getTime()) /
                        (1000 * 60 * 60)) *
                        10) / 10;
            }
            let displayStatus;
            if (att?.checkIn) {
                displayStatus = att.status;
                todayCheckedInTotal++;
                if (att.status === "LATE")
                    todayLate++;
                else
                    todayPresent++;
                if (att.checkOut)
                    todayCheckedOut++;
                if (att.earlyMinutes && att.earlyMinutes > 0)
                    todayEarly++;
            }
            else if (att?.absenceReason) {
                displayStatus = "SABABLI";
                todayReasonGiven++;
                todayUnmarked++;
            }
            else if (!isEmpWorkingDay) {
                displayStatus = "DAM_OLISH";
                todayUnmarked++;
            }
            else {
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
        const isDefaultWorkingDay = (defaultSchedule.workingDays || [1, 2, 3, 4, 5]).includes(dayOfWeek);
        const now = new Date();
        const absentRecords = [];
        allEmployees.forEach((emp) => {
            const empSchedule = schedules.find((s) => s.employeeId === emp.id) ||
                (emp.departmentId
                    ? schedules.find((s) => s.departmentId === emp.departmentId)
                    : null) ||
                defaultSchedule;
            const workingDaysArr = empSchedule.workingDays || [1, 2, 3, 4, 5];
            const empCreatedAtRaw = emp.createdAt || emp.user?.createdAt || threeMonthsAgo;
            const empCreatedAt = new Date(empCreatedAtRaw);
            empCreatedAt.setHours(0, 0, 0, 0);
            const evalStart = empCreatedAt > threeMonthsAgo ? empCreatedAt : threeMonthsAgo;
            const evalEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            const empAttendances = allPastAttendances.filter((a) => a.employeeId === emp.id);
            const empLeaves = allPastLeaves.filter((l) => l.employeeId === emp.id);
            if (evalStart <= evalEnd) {
                const curDay = new Date(evalStart);
                while (curDay <= evalEnd) {
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
                        const hasCheckedIn = Boolean(att?.checkIn || att?.status === "PRESENT" || att?.status === "LATE" || att?.status === "HALF_DAY");
                        if (!hasCheckedIn && !onLeave) {
                            if (!isToday || (isToday && att?.absenceReason)) {
                                absentRecords.push({
                                    id: att?.id || `absent-${emp.id}-${curDayStr}`,
                                    employeeId: emp.id,
                                    date: curDayStr,
                                    employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
                                    department: emp.department?.name || "-",
                                    position: emp.position?.title || "-",
                                    status: att?.absenceReason ? "SABABLI" : "SABABSIZ",
                                    absenceReason: att?.absenceReason || null,
                                    reasonSubmittedBy: att?.reasonSubmittedBy || null,
                                    employee: {
                                        id: emp.id,
                                        firstName: emp.firstName,
                                        lastName: emp.lastName,
                                        department: emp.department,
                                        position: emp.position,
                                    },
                                });
                            }
                        }
                    }
                    curDay.setDate(curDay.getDate() + 1);
                }
            }
        });
        absentRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const monthNames = [
            "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
            "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
        ];
        const lastThreeMonths = [];
        for (let i = 0; i < 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const mStart = new Date(y, m - 1, 1);
            const mEnd = new Date(y, m, 0, 23, 59, 59, 999);
            let mWorkingDays = 0;
            const curIter = new Date(mStart);
            while (curIter <= mEnd) {
                const dow = curIter.getDay() === 0 ? 7 : curIter.getDay();
                if ([1, 2, 3, 4, 5].includes(dow))
                    mWorkingDays++;
                curIter.setDate(curIter.getDate() + 1);
            }
            const mAttendances = allPastAttendances.filter((a) => {
                if (!a.date)
                    return false;
                const ad = new Date(a.date);
                return ad >= mStart && ad <= mEnd;
            });
            const mAttended = mAttendances.filter((a) => a.checkIn).length;
            const mLates = mAttendances.filter((a) => a.status === "LATE" || (a.lateMinutes && a.lateMinutes > 0)).length;
            const mAbsents = absentRecords.filter((ar) => {
                const ard = new Date(ar.date);
                return ard >= mStart && ard <= mEnd;
            }).length;
            lastThreeMonths.push({
                month: m,
                year: y,
                monthName: monthNames[m - 1],
                totalWorkingDays: mWorkingDays,
                attendedCount: mAttended,
                absentCount: mAbsents,
                lateCount: mLates,
            });
        }
        const employeeThreeMonthSummaries = allEmployees.map((emp) => {
            const empPastAtts = allPastAttendances.filter((a) => a.employeeId === emp.id);
            const empAbsents = absentRecords.filter((a) => a.employeeId === emp.id);
            const attendedCount = empPastAtts.filter((a) => a.checkIn).length;
            const lateCount = empPastAtts.filter((a) => a.status === "LATE" || (a.lateMinutes && a.lateMinutes > 0)).length;
            const absentCount = empAbsents.length;
            const totalEvents = attendedCount + absentCount;
            const attendanceRate = totalEvents > 0 ? Math.round((attendedCount / totalEvents) * 100) : 100;
            return {
                employeeId: emp.id,
                name: `${emp.firstName} ${emp.lastName}`.trim(),
                department: emp.department?.name || "-",
                position: emp.position?.title || "-",
                attendedCount,
                absentCount,
                lateCount,
                attendanceRate,
            };
        });
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
            absentRecords,
            threeMonthSummary: {
                months: lastThreeMonths,
                employeeSummaries: employeeThreeMonthSummaries,
            },
        };
    }
    async getMobileDashboardData(rawUserId) {
        const employee = await this.resolveEmployee(rawUserId);
        const recentAttendances = await db_1.default.attendance.findMany({
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
exports.AttendanceService = AttendanceService;
exports.attendanceService = new AttendanceService();

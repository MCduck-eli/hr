"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceService = exports.DeviceService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
const device_factory_1 = require("./device.factory");
const attendance_service_1 = require("../attendance/attendance-service");
const notification_service_1 = require("../notification/notification-service");
class DeviceService {
    async resolveEmployeeForDevice(identifier) {
        if (!identifier) {
            throw new appError_1.AppError("Qurilma logida xodim identifikatori topilmadi", 400);
        }
        let employee = await db_1.default.employee.findFirst({
            where: {
                OR: [
                    { userId: identifier },
                    { id: identifier },
                    { user: { email: identifier } },
                    { user: { phone: identifier } },
                ],
            },
            include: { user: true, department: true, position: true },
        });
        if (!employee) {
            const user = await db_1.default.user.findFirst({
                where: {
                    OR: [
                        { id: identifier },
                        { email: identifier },
                        { phone: identifier },
                    ],
                },
            });
            if (user) {
                employee = await db_1.default.employee.findFirst({
                    where: { userId: user.id },
                    include: { user: true, department: true, position: true },
                });
            }
        }
        if (!employee) {
            throw new appError_1.AppError(`Qurilma identifikatoriga mos keluvchi xodim topilmadi: ${identifier}`, 404);
        }
        return employee;
    }
    async processDeviceLog(provider, rawPayload) {
        const adapter = device_factory_1.DeviceAdapterFactory.getAdapter(provider);
        const parsedLog = adapter.parsePayload(rawPayload);
        const employee = await this.resolveEmployeeForDevice(parsedLog.employeeUserId);
        const schedule = await attendance_service_1.attendanceService.getEffectiveScheduleForEmployee(employee.id, employee.departmentId);
        const logTimestamp = parsedLog.timestamp instanceof Date && !isNaN(parsedLog.timestamp.getTime())
            ? parsedLog.timestamp
            : new Date();
        const logDate = new Date(logTimestamp);
        logDate.setHours(0, 0, 0, 0);
        const existingAttendance = await db_1.default.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: employee.id,
                    date: logDate,
                },
            },
        });
        const timeStr = logTimestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        const deviceLabel = parsedLog.deviceId
            ? `${parsedLog.deviceType} (${parsedLog.deviceId})`
            : parsedLog.deviceType;
        if (!existingAttendance || !existingAttendance.checkIn) {
            const [startHour, startMinute] = (schedule.startTime || "09:00")
                .split(":")
                .map(Number);
            const targetStartTime = new Date(logDate);
            targetStartTime.setHours(startHour, startMinute, 0, 0);
            const targetGraceTime = new Date(targetStartTime.getTime() +
                (schedule.gracePeriodMinutes || 15) * 60 * 1000);
            let lateMinutes = 0;
            let status = "PRESENT";
            if (logTimestamp.getTime() > targetGraceTime.getTime()) {
                lateMinutes = Math.max(0, Math.floor((logTimestamp.getTime() - targetStartTime.getTime()) / (1000 * 60)));
                status = "LATE";
            }
            const formattedLate = lateMinutes >= 60
                ? `${Math.floor(lateMinutes / 60)} soat ${lateMinutes % 60 > 0 ? `${lateMinutes % 60} daqiqa ` : ""}kechikdi`
                : `${lateMinutes} daqiqa kechikdi`;
            const statusLabel = status === "LATE" ? formattedLate : "Vaqtida keldi";
            let result;
            if (existingAttendance) {
                result = await db_1.default.attendance.update({
                    where: { id: existingAttendance.id },
                    data: {
                        checkIn: logTimestamp,
                        status,
                        lateMinutes,
                        note: `Auto Check-In via ${deviceLabel}`,
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
                        date: logDate,
                        checkIn: logTimestamp,
                        status,
                        lateMinutes,
                        note: `Auto Check-In via ${deviceLabel}`,
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
            try {
                await notification_service_1.notificationService.notifyAllUsers({
                    title: `Biometrik Check-In (${employee.firstName} ${employee.lastName})`,
                    message: `${employee.firstName} ${employee.lastName} soat ${timeStr} da ${deviceLabel} orqali davomatni qayd etdi (${statusLabel}). Kutilgan vaqt: ${schedule.startTime}`,
                    type: "GENERAL",
                    excludeUserId: employee.userId,
                    targetRoles: ["DIRECTOR", "HR_ADMIN"],
                    companyName: employee.user?.companyName || undefined,
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
        const [endHour, endMinute] = (schedule.endTime || "18:00")
            .split(":")
            .map(Number);
        const targetEndTime = new Date(logDate);
        targetEndTime.setHours(endHour, endMinute, 0, 0);
        let earlyMinutes = 0;
        if (logTimestamp.getTime() < targetEndTime.getTime()) {
            earlyMinutes = Math.max(0, Math.floor((targetEndTime.getTime() - logTimestamp.getTime()) / (1000 * 60)));
        }
        const updatedNote = existingAttendance.note
            ? `${existingAttendance.note} | Auto Check-Out via ${deviceLabel}`
            : `Auto Check-Out via ${deviceLabel}`;
        const result = await db_1.default.attendance.update({
            where: { id: existingAttendance.id },
            data: {
                checkOut: logTimestamp,
                earlyMinutes,
                note: updatedNote,
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
        const formattedEarly = earlyMinutes >= 60
            ? `${Math.floor(earlyMinutes / 60)} soat ${earlyMinutes % 60 > 0 ? `${earlyMinutes % 60} daqiqa ` : ""}erta ketdi`
            : `${earlyMinutes} daqiqa erta ketdi`;
        const earlyLabel = earlyMinutes > 0 ? ` (${formattedEarly})` : "";
        try {
            await notification_service_1.notificationService.notifyAllUsers({
                title: `Biometrik Check-Out (${employee.firstName} ${employee.lastName})`,
                message: `${employee.firstName} ${employee.lastName} soat ${timeStr} da ${deviceLabel} orqali chiqishni (Check Out) qayd etdi${earlyLabel}. Kutilgan vaqt: ${schedule.endTime}`,
                type: "GENERAL",
                excludeUserId: employee.userId,
                targetRoles: ["DIRECTOR", "HR_ADMIN"],
                companyName: employee.user?.companyName || undefined,
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
}
exports.DeviceService = DeviceService;
exports.deviceService = new DeviceService();

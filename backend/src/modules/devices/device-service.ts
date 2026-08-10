import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { DeviceAdapterFactory } from "./device.factory";

export class DeviceService {
    async processDeviceLog(provider: string, rawPayload: any) {
        const adapter = DeviceAdapterFactory.getAdapter(provider);
        const parsedLog = adapter.parsePayload(rawPayload);

        const employee = await prisma.employee.findUnique({
            where: { userId: parsedLog.employeeUserId },
        });

        if (!employee) {
            throw new AppError(
                `Employee not found for userId: ${parsedLog.employeeUserId}`,
                404,
            );
        }

        const logDate = new Date(parsedLog.timestamp);
        logDate.setHours(0, 0, 0, 0);

        const existingAttendance = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: employee.id,
                    date: logDate,
                },
            },
        });

        if (!existingAttendance) {
            return prisma.attendance.create({
                data: {
                    employeeId: employee.id,
                    date: logDate,
                    checkIn: parsedLog.timestamp,
                    status: "PRESENT",
                    note: `Auto Check-In via ${parsedLog.deviceType}`,
                },
            });
        }

        return prisma.attendance.update({
            where: { id: existingAttendance.id },
            data: {
                checkOut: parsedLog.timestamp,
                note: `${existingAttendance.note || ""} | Auto Check-Out via ${parsedLog.deviceType}`,
            },
        });
    }
}

export const deviceService = new DeviceService();

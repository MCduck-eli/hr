import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export type AttendanceStatus =
    | "PRESENT"
    | "ABSENT"
    | "LATE"
    | "HALF_DAY"
    | "ON_LEAVE";

export class AttendanceService {
    async checkIn(userId: string, note?: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

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
            throw new AppError("Already checked in today", 400);
        }

        const now = new Date();
        const isLate = now.getHours() >= 9 && now.getMinutes() > 15;
        const status: AttendanceStatus = isLate ? "LATE" : "PRESENT";

        if (existingAttendance) {
            return prisma.attendance.update({
                where: { id: existingAttendance.id },
                data: {
                    checkIn: now,
                    status,
                    ...(note && { note }),
                },
            });
        }

        return prisma.attendance.create({
            data: {
                employeeId: employee.id,
                date: today,
                checkIn: now,
                status,
                note,
            },
        });
    }

    async checkOut(userId: string, note?: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

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
            throw new AppError("Must check in before checking out", 400);
        }

        if (attendance.checkOut) {
            throw new AppError("Already checked out today", 400);
        }

        return prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                checkOut: new Date(),
                ...(note && {
                    note: attendance.note
                        ? `${attendance.note} | ${note}`
                        : note,
                }),
            },
        });
    }

    async getMyAttendance(
        userId: string,
        query: { startDate?: string; endDate?: string },
    ) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        const where: any = { employeeId: employee.id };

        if (query.startDate || query.endDate) {
            where.date = {};
            if (query.startDate) where.date.gte = new Date(query.startDate);
            if (query.endDate) where.date.lte = new Date(query.endDate);
        }

        return prisma.attendance.findMany({
            where,
            orderBy: { date: "desc" },
        });
    }

    async getAllAttendance(query: {
        startDate?: string;
        endDate?: string;
        employeeId?: string;
    }) {
        const where: any = {};

        if (query.employeeId) {
            where.employeeId = query.employeeId;
        }

        if (query.startDate || query.endDate) {
            where.date = {};
            if (query.startDate) where.date.gte = new Date(query.startDate);
            if (query.endDate) where.date.lte = new Date(query.endDate);
        }

        return prisma.attendance.findMany({
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
            orderBy: { date: "desc" },
        });
    }
}

export const attendanceService = new AttendanceService();

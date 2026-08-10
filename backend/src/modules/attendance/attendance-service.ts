import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { calculateDistanceInMeters } from "../../utils/geofence.util";
import { AttendanceStatus } from "@prisma/client";

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

    async gpsCheckIn(
        userId: string,
        payload: {
            latitude: number;
            longitude: number;
            address?: string;
            isSpoofed?: boolean;
        },
    ) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
            include: { department: true },
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

        const zones = await prisma.geofenceZone.findMany({
            where: {
                OR: [
                    { departmentId: employee.departmentId },
                    { departmentId: null },
                ],
            },
        });

        let isOutsideGeofence = true;

        if (zones.length > 0) {
            for (const zone of zones) {
                const distance = calculateDistanceInMeters(
                    payload.latitude,
                    payload.longitude,
                    zone.latitude,
                    zone.longitude,
                );
                if (distance <= zone.radius) {
                    isOutsideGeofence = false;
                    break;
                }
            }
        } else {
            isOutsideGeofence = false;
        }

        const now = new Date();
        const isLate = now.getHours() >= 9 && now.getMinutes() > 15;
        const status: AttendanceStatus = isLate ? "LATE" : "PRESENT";

        return prisma.attendance.upsert({
            where: {
                employeeId_date: {
                    employeeId: employee.id,
                    date: today,
                },
            },
            update: {
                checkIn: now,
                checkInLat: payload.latitude,
                checkInLng: payload.longitude,
                checkInAddress: payload.address,
                isOutsideGeofence,
                isSpoofed: payload.isSpoofed || false,
                status,
            },
            create: {
                employeeId: employee.id,
                date: today,
                checkIn: now,
                checkInLat: payload.latitude,
                checkInLng: payload.longitude,
                checkInAddress: payload.address,
                isOutsideGeofence,
                isSpoofed: payload.isSpoofed || false,
                status,
            },
        });
    }

    async gpsCheckOut(
        userId: string,
        payload: {
            latitude: number;
            longitude: number;
            address?: string;
            isSpoofed?: boolean;
        },
    ) {
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
                checkOutLat: payload.latitude,
                checkOutLng: payload.longitude,
                checkOutAddress: payload.address,
                isSpoofed: attendance.isSpoofed || payload.isSpoofed || false,
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

    async getMobileDashboardData(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                leaveBalance: true,
                department: { select: { name: true } },
                position: { select: { title: true } },
            },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

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

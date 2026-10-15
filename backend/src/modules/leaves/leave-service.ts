import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { LeaveType, LeaveStatus } from "@prisma/client";

export class LeaveService {
    async createLeaveRequest(
        userId: string,
        payload: {
            type: LeaveType;
            startDate: string;
            endDate: string;
            reason: string;
        },
    ) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        const start = new Date(payload.startDate);
        const end = new Date(payload.endDate);

        if (start > end) {
            throw new AppError("Start date cannot be after end date", 400);
        }

        return prisma.leaveRequest.create({
            data: {
                employeeId: employee.id,
                type: payload.type,
                startDate: start,
                endDate: end,
                reason: payload.reason,
                status: LeaveStatus.PENDING,
            },
        });
    }

    async getMyLeaveRequests(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        return prisma.leaveRequest.findMany({
            where: { employeeId: employee.id },
            orderBy: { createdAt: "desc" },
        });
    }

    private async resolveCallerCompany(currentUser?: any): Promise<string | null> {
        if (!currentUser) return null;
        if (currentUser.role === "SUPER_ADMIN" && !currentUser.companyName && !currentUser.companyId) return null;
        if (currentUser.companyId) return currentUser.companyId;
        if (currentUser.companyName) return currentUser.companyName;

        if (currentUser.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });

            if (caller) {
                if (caller.role === "SUPER_ADMIN" && !caller.companyName) {
                    return null;
                }
                return caller.companyName || null;
            }
        }
        return null;
    }

    async getAllLeaveRequests(status?: LeaveStatus, currentUser?: any) {
        const callerCompany = await this.resolveCallerCompany(currentUser);

        const where: any = {
            ...(status ? { status } : {}),
        };

        if (currentUser && currentUser.role !== "SUPER_ADMIN") {
            where.employee = {
                user: {
                    companyName: callerCompany || "__NO_COMPANY__",
                },
            };
        } else if (callerCompany) {
            where.employee = {
                user: {
                    companyName: callerCompany,
                },
            };
        }

        return prisma.leaveRequest.findMany({
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
            orderBy: { createdAt: "desc" },
        });
    }

    async updateLeaveStatus(
        id: string,
        status: LeaveStatus,
        managerUserId: string,
        currentUser?: any,
    ) {
        const callerCompany = await this.resolveCallerCompany(currentUser);

        const leaveRequest = await prisma.leaveRequest.findFirst({
            where: {
                id,
                ...(callerCompany && currentUser?.role !== "SUPER_ADMIN"
                    ? {
                          employee: {
                              user: {
                                  companyName: callerCompany,
                              },
                          },
                      }
                    : {}),
            },
        });

        if (!leaveRequest) {
            throw new AppError("Leave request not found", 404);
        }

        if (leaveRequest.status !== LeaveStatus.PENDING) {
            throw new AppError("Leave request has already been processed", 400);
        }

        const updatedLeave = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status,
                approvedBy: managerUserId,
            },
        });

        if (status === LeaveStatus.APPROVED) {
            const currentDate = new Date(leaveRequest.startDate);
            const endDate = new Date(leaveRequest.endDate);

            while (currentDate <= endDate) {
                const dateToInsert = new Date(currentDate);
                dateToInsert.setHours(0, 0, 0, 0);

                await prisma.attendance.upsert({
                    where: {
                        employeeId_date: {
                            employeeId: leaveRequest.employeeId,
                            date: dateToInsert,
                        },
                    },
                    update: {
                        status: "ON_LEAVE",
                    },
                    create: {
                        employeeId: leaveRequest.employeeId,
                        date: dateToInsert,
                        status: "ON_LEAVE",
                        note: `Leave Approved: ${leaveRequest.type}`,
                    },
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        return updatedLeave;
    }
}

export const leaveService = new LeaveService();

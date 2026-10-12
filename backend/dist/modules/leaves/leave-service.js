"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveService = exports.LeaveService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
const client_1 = require("@prisma/client");
class LeaveService {
    async createLeaveRequest(userId, payload) {
        const employee = await db_1.default.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new appError_1.AppError("Employee profile not found", 404);
        }
        const start = new Date(payload.startDate);
        const end = new Date(payload.endDate);
        if (start > end) {
            throw new appError_1.AppError("Start date cannot be after end date", 400);
        }
        return db_1.default.leaveRequest.create({
            data: {
                employeeId: employee.id,
                type: payload.type,
                startDate: start,
                endDate: end,
                reason: payload.reason,
                status: client_1.LeaveStatus.PENDING,
            },
        });
    }
    async getMyLeaveRequests(userId) {
        const employee = await db_1.default.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new appError_1.AppError("Employee profile not found", 404);
        }
        return db_1.default.leaveRequest.findMany({
            where: { employeeId: employee.id },
            orderBy: { createdAt: "desc" },
        });
    }
    async getAllLeaveRequests(status) {
        const where = status ? { status } : {};
        return db_1.default.leaveRequest.findMany({
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
    async updateLeaveStatus(id, status, managerUserId) {
        const leaveRequest = await db_1.default.leaveRequest.findUnique({
            where: { id },
        });
        if (!leaveRequest) {
            throw new appError_1.AppError("Leave request not found", 404);
        }
        if (leaveRequest.status !== client_1.LeaveStatus.PENDING) {
            throw new appError_1.AppError("Leave request has already been processed", 400);
        }
        const updatedLeave = await db_1.default.leaveRequest.update({
            where: { id },
            data: {
                status,
                approvedBy: managerUserId,
            },
        });
        if (status === client_1.LeaveStatus.APPROVED) {
            const currentDate = new Date(leaveRequest.startDate);
            const endDate = new Date(leaveRequest.endDate);
            while (currentDate <= endDate) {
                const dateToInsert = new Date(currentDate);
                dateToInsert.setHours(0, 0, 0, 0);
                await db_1.default.attendance.upsert({
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
exports.LeaveService = LeaveService;
exports.leaveService = new LeaveService();

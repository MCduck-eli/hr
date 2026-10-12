"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceService = exports.PerformanceService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
class PerformanceService {
    async createReview(reviewerUserId, payload) {
        const employee = await db_1.default.employee.findUnique({
            where: { id: payload.employeeId },
        });
        if (!employee) {
            throw new appError_1.AppError("Employee not found", 404);
        }
        return db_1.default.performanceReview.create({
            data: {
                employeeId: payload.employeeId,
                reviewerId: reviewerUserId,
                score: payload.score,
                feedback: payload.feedback,
                period: payload.period,
            },
        });
    }
    async getMyReviews(userId) {
        const employee = await db_1.default.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new appError_1.AppError("Employee profile not found", 404);
        }
        return db_1.default.performanceReview.findMany({
            where: { employeeId: employee.id },
            orderBy: { createdAt: "desc" },
        });
    }
    async getEmployeeReviews(employeeId) {
        return db_1.default.performanceReview.findMany({
            where: { employeeId },
            orderBy: { createdAt: "desc" },
        });
    }
}
exports.PerformanceService = PerformanceService;
exports.performanceService = new PerformanceService();

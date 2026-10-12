"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceController = exports.PerformanceController = void 0;
const performance_service_1 = require("./performance-service");
class PerformanceController {
    async create(req, res, next) {
        try {
            const result = await performance_service_1.performanceService.createReview(req.user.id, req.body);
            res.status(201).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyReviews(req, res, next) {
        try {
            const result = await performance_service_1.performanceService.getMyReviews(req.user.id);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getEmployeeReviews(req, res, next) {
        try {
            const result = await performance_service_1.performanceService.getEmployeeReviews(req.params.employeeId);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PerformanceController = PerformanceController;
exports.performanceController = new PerformanceController();

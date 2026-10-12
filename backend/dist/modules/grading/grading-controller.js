"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradingController = exports.GradingController = void 0;
const grading_service_1 = require("./grading-service");
class GradingController {
    async createGrade(req, res, next) {
        try {
            const result = await grading_service_1.gradingService.createGrade(req.body, req.user);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getGrades(req, res, next) {
        try {
            const result = await grading_service_1.gradingService.getGrades(req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateGrade(req, res, next) {
        try {
            const result = await grading_service_1.gradingService.updateGrade(req.params.gradeId, req.body, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteGrade(req, res, next) {
        try {
            const result = await grading_service_1.gradingService.deleteGrade(req.params.gradeId, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getEmployeesWithGrades(req, res, next) {
        try {
            const result = await grading_service_1.gradingService.getEmployeesWithGrades(req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getPromotionRequests(req, res, next) {
        try {
            const result = await grading_service_1.gradingService.getPromotionRequests(req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async assignGradeToEmployee(req, res, next) {
        try {
            const result = await grading_service_1.gradingService.assignGradeToEmployee(req.params.employeeId, req.body.gradeId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async createPromotionRequest(req, res, next) {
        try {
            const result = await grading_service_1.gradingService.createPromotionRequest(req.body, req.user);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async processPromotionApproval(req, res, next) {
        try {
            const userRole = req.user.role;
            const result = await grading_service_1.gradingService.processPromotionApproval(req.params.requestId, userRole, req.body.action);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getCareerHistory(req, res, next) {
        try {
            const result = await grading_service_1.gradingService.getCareerHistory(req.params.employeeId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.GradingController = GradingController;
exports.gradingController = new GradingController();

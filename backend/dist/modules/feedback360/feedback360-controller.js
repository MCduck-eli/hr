"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedback360Controller = exports.Feedback360Controller = void 0;
const feedback360_service_1 = require("./feedback360-service");
class Feedback360Controller {
    async createCycle(req, res, next) {
        try {
            const result = await feedback360_service_1.feedback360Service.createCycle(req.body, req.user);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getCycles(req, res, next) {
        try {
            const result = await feedback360_service_1.feedback360Service.getCycles(req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateCycle(req, res, next) {
        try {
            const result = await feedback360_service_1.feedback360Service.updateCycle(req.params.id, req.body, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteCycle(req, res, next) {
        try {
            const result = await feedback360_service_1.feedback360Service.deleteCycle(req.params.id, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getAssignments(req, res, next) {
        try {
            const cycleId = req.query.cycleId;
            const targetId = req.query.targetId;
            const result = await feedback360_service_1.feedback360Service.getAssignments(cycleId, targetId, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async assignReviewers(req, res, next) {
        try {
            const result = await feedback360_service_1.feedback360Service.assignReviewers(req.body.cycleId, req.body.targetId, req.body.reviewers, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyPendingTasks(req, res, next) {
        try {
            const user = req.user;
            let userId = user.id;
            if (req.query.userId && (user.role === "SUPER_ADMIN" || user.role === "HR_ADMIN")) {
                userId = req.query.userId;
            }
            const result = await feedback360_service_1.feedback360Service.getMyPendingTasks(userId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getAssignmentById(req, res, next) {
        try {
            const user = req.user;
            const result = await feedback360_service_1.feedback360Service.getAssignmentById(req.params.assignmentId, user.id, user.role);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteAssignment(req, res, next) {
        try {
            const result = await feedback360_service_1.feedback360Service.deleteAssignment(req.params.assignmentId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async submitFeedback(req, res, next) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;
            const result = await feedback360_service_1.feedback360Service.submitFeedback(req.params.assignmentId, userId, userRole, req.body.answers);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getTargetReport(req, res, next) {
        try {
            const cycleId = req.query.cycleId;
            const user = req.user;
            const result = await feedback360_service_1.feedback360Service.getTargetReport(req.params.employeeId, cycleId, user.id, user.role);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.Feedback360Controller = Feedback360Controller;
exports.feedback360Controller = new Feedback360Controller();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discController = exports.DiscController = void 0;
const disc_service_1 = require("./disc-service");
class DiscController {
    async createQuestion(req, res, next) {
        try {
            const currentUser = req.user;
            const result = await disc_service_1.discService.createQuestion(req.body, currentUser);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateQuestion(req, res, next) {
        try {
            const currentUser = req.user;
            const result = await disc_service_1.discService.updateQuestion(req.params.id, req.body, currentUser);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteQuestion(req, res, next) {
        try {
            const currentUser = req.user;
            const result = await disc_service_1.discService.deleteQuestion(req.params.id, currentUser);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getQuestions(req, res, next) {
        try {
            const currentUser = req.user;
            const result = await disc_service_1.discService.getQuestions(currentUser);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async submitAssessment(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await disc_service_1.discService.submitAssessment(userId, req.body.answers);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyDiscProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await disc_service_1.discService.getMyDiscProfile(userId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getTeamDiscAnalytics(req, res, next) {
        try {
            const departmentId = req.query.departmentId;
            const currentUser = req.user;
            const result = await disc_service_1.discService.getTeamDiscAnalytics(departmentId, currentUser);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DiscController = DiscController;
exports.discController = new DiscController();

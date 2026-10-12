"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enpsController = exports.EnpsController = void 0;
const enps_service_1 = require("./enps-service");
class EnpsController {
    async getQuestions(req, res, next) {
        try {
            const user = req.user;
            const companyName = user?.companyName || null;
            const activeOnly = req.query.activeOnly === "true";
            const result = await enps_service_1.enpsService.getQuestions(companyName, activeOnly);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async createQuestion(req, res, next) {
        try {
            const user = req.user;
            const companyName = user?.companyName || null;
            const result = await enps_service_1.enpsService.createQuestion(companyName, req.body);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateQuestion(req, res, next) {
        try {
            const user = req.user;
            const companyName = user?.companyName || null;
            const { id } = req.params;
            const result = await enps_service_1.enpsService.updateQuestion(id, companyName, req.body);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteQuestion(req, res, next) {
        try {
            const user = req.user;
            const companyName = user?.companyName || null;
            const { id } = req.params;
            const result = await enps_service_1.enpsService.deleteQuestion(id, companyName);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async submitEnps(req, res, next) {
        try {
            const user = req.user;
            const result = await enps_service_1.enpsService.submitEnps(user.id, req.body);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyLatestEnps(req, res, next) {
        try {
            const user = req.user;
            const questionId = req.query.questionId;
            const result = await enps_service_1.enpsService.getMyLatestEnps(user.id, questionId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getEnpsAnalytics(req, res, next) {
        try {
            const user = req.user;
            const companyName = user?.companyName || null;
            const result = await enps_service_1.enpsService.getEnpsAnalytics(companyName);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.EnpsController = EnpsController;
exports.enpsController = new EnpsController();

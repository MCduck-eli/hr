"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lifecycleController = exports.LifecycleController = void 0;
const lifecycle_service_1 = require("./lifecycle-service");
class LifecycleController {
    async createTemplate(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.createTemplate(req.body, req.user);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getTemplates(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.getTemplates(req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateTemplate(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.updateTemplate(req.params.templateId, req.body, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTemplate(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.deleteTemplate(req.params.templateId, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async applyTemplateToEmployee(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.applyTemplateToEmployee(req.params.employeeId, req.body.templateId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateChecklistStatus(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.updateChecklistStatus(req.params.checklistId, req.body.status);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getEmployeeJourney(req, res, next) {
        try {
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const eventType = req.query.eventType;
            const currentUser = req.user;
            const result = await lifecycle_service_1.lifecycleService.getEmployeeJourney(req.params.employeeId, {
                startDate,
                endDate,
                eventType,
            }, currentUser);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async createLifecycleEvent(req, res, next) {
        try {
            const currentUser = req.user;
            const result = await lifecycle_service_1.lifecycleService.createLifecycleEvent(req.params.employeeId, req.body, currentUser);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateLifecycleEvent(req, res, next) {
        try {
            const currentUser = req.user;
            const result = await lifecycle_service_1.lifecycleService.updateLifecycleEvent(req.params.eventId, req.body, currentUser);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteLifecycleEvent(req, res, next) {
        try {
            const currentUser = req.user;
            const result = await lifecycle_service_1.lifecycleService.deleteLifecycleEvent(req.params.eventId, currentUser);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllOffboarding(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.getAllOffboardingRequests(req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async startOffboarding(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.startOffboarding(req.params.employeeId, req.body, req.user);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getOffboardingDetails(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.getOffboardingDetails(req.params.employeeId, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateOffboardingTask(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.updateOffboardingTask(req.params.taskId, req.body.isCompleted, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async editOffboardingTask(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.editOffboardingTask(req.params.taskId, req.body, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async addOffboardingTask(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.addOffboardingTask(req.params.offboardingId, req.body, req.user);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteOffboardingTask(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.deleteOffboardingTask(req.params.taskId, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async submitExitInterview(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.submitExitInterview(req.params.employeeId, req.body, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateOffboardingStatus(req, res, next) {
        try {
            const result = await lifecycle_service_1.lifecycleService.updateOffboardingStatus(req.params.offboardingId, req.body.status, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async exportEmployeeJourney(req, res, next) {
        try {
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const eventType = req.query.eventType;
            const { filename, csvContent } = await lifecycle_service_1.lifecycleService.exportEmployeeJourneyCSV(req.params.employeeId, { startDate, endDate, eventType });
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.status(200).send("\uFEFF" + csvContent);
        }
        catch (error) {
            next(error);
        }
    }
    async getStageStats(req, res, next) {
        try {
            const departmentId = req.query.departmentId;
            const result = await lifecycle_service_1.lifecycleService.getStageStats(departmentId, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LifecycleController = LifecycleController;
exports.lifecycleController = new LifecycleController();

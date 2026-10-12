"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.okrController = exports.OkrController = void 0;
const okr_service_1 = require("./okr-service");
class OkrController {
    async createCycle(req, res, next) {
        try {
            const result = await okr_service_1.okrService.createCycle(req.body, req.user);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getCycles(req, res, next) {
        try {
            const result = await okr_service_1.okrService.getCycles(req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async createObjective(req, res, next) {
        try {
            const result = await okr_service_1.okrService.createObjective(req.body, req.user);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateObjective(req, res, next) {
        try {
            const result = await okr_service_1.okrService.updateObjective(req.params.objectiveId, req.body);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteObjective(req, res, next) {
        try {
            await okr_service_1.okrService.deleteObjective(req.params.objectiveId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async checkInKeyResult(req, res, next) {
        try {
            const userId = req.user.id;
            const files = req.files;
            let imageUrl = undefined;
            if (files && files.proofImage && files.proofImage[0]) {
                imageUrl = `/uploads/${files.proofImage[0].filename}`;
            }
            const rawProgress = req.body.progress || req.body.percentage || req.body.value;
            const parsedValue = rawProgress !== undefined && rawProgress !== "" ? Number(rawProgress) : undefined;
            const result = await okr_service_1.okrService.checkInKeyResult(req.params.keyResultId, req.body.comment, imageUrl, userId, parsedValue);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateObjectiveStatus(req, res, next) {
        try {
            const result = await okr_service_1.okrService.updateObjectiveStatus(req.params.objectiveId, req.body.status);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getDashboard(req, res, next) {
        try {
            const cycleId = req.query.cycleId;
            const departmentId = req.query.departmentId;
            const result = await okr_service_1.okrService.getDashboard(cycleId, departmentId, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getPendingCheckIns(req, res, next) {
        try {
            const result = await okr_service_1.okrService.getPendingCheckIns(req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async reviewCheckIn(req, res, next) {
        try {
            const { status } = req.body;
            const rawProgress = req.body.progress ?? req.body.value ?? req.body.percentage;
            const parsedProgress = rawProgress !== undefined && rawProgress !== null && rawProgress !== "" ? Number(rawProgress) : undefined;
            const reason = req.body.rejectReason || req.body.reason || req.body.feedback || req.body.comment;
            const result = await okr_service_1.okrService.reviewCheckIn(req.params.checkInId, status, parsedProgress, reason);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OkrController = OkrController;
exports.okrController = new OkrController();

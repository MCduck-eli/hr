"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveController = exports.LeaveController = void 0;
const leave_service_1 = require("./leave-service");
class LeaveController {
    async create(req, res, next) {
        try {
            const result = await leave_service_1.leaveService.createLeaveRequest(req.user.id, req.body);
            res.status(201).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyLeaves(req, res, next) {
        try {
            const result = await leave_service_1.leaveService.getMyLeaveRequests(req.user.id);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllLeaves(req, res, next) {
        try {
            const status = req.query.status;
            const result = await leave_service_1.leaveService.getAllLeaveRequests(status);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const result = await leave_service_1.leaveService.updateLeaveStatus(req.params.id, req.body.status, req.user.id);
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
exports.LeaveController = LeaveController;
exports.leaveController = new LeaveController();

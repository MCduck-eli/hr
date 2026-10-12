"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeStatusController = exports.EmployeeStatusController = void 0;
const employee_status_service_1 = require("./employee-status-service");
class EmployeeStatusController {
    async getAllStatuses(req, res, next) {
        try {
            const data = await employee_status_service_1.employeeStatusService.getAllStatuses(req.user);
            res.status(200).json({ status: "success", data });
        }
        catch (error) {
            next(error);
        }
    }
    async createStatus(req, res, next) {
        try {
            const data = await employee_status_service_1.employeeStatusService.createStatus(req.body, req.user);
            res.status(201).json({ status: "success", data });
        }
        catch (error) {
            next(error);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const data = await employee_status_service_1.employeeStatusService.updateStatus(req.params.id, req.body, req.user);
            res.status(200).json({ status: "success", data });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteStatus(req, res, next) {
        try {
            const data = await employee_status_service_1.employeeStatusService.deleteStatus(req.params.id, req.user);
            res.status(200).json({ status: "success", data });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.EmployeeStatusController = EmployeeStatusController;
exports.employeeStatusController = new EmployeeStatusController();

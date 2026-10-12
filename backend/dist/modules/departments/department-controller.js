"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentController = exports.DepartmentController = void 0;
const department_service_1 = require("./department-service");
class DepartmentController {
    async create(req, res, next) {
        try {
            const result = await department_service_1.departmentService.createDepartment(req.body, req.user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAll(req, res, next) {
        try {
            const result = await department_service_1.departmentService.getAllDepartments(req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getOne(req, res, next) {
        try {
            const result = await department_service_1.departmentService.getDepartmentById(req.params.id, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async assignEmployee(req, res, next) {
        try {
            const result = await department_service_1.departmentService.assignEmployee(req.params.id, req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async unassignEmployee(req, res, next) {
        try {
            const result = await department_service_1.departmentService.unassignEmployee(req.params.id, req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            await department_service_1.departmentService.deleteDepartment(req.params.id, req.user);
            res.status(200).json({
                status: "success",
                message: "Department deleted successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DepartmentController = DepartmentController;
exports.departmentController = new DepartmentController();

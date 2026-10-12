"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleController = exports.RoleController = void 0;
const role_service_1 = require("./role-service");
class RoleController {
    async getAll(req, res, next) {
        try {
            const result = await role_service_1.roleService.getAllRoles(req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const result = await role_service_1.roleService.createRole(req.body, req.user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const result = await role_service_1.roleService.updateRole(req.params.id, req.body, req.user);
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
            const result = await role_service_1.roleService.deleteRole(req.params.id, req.user);
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
exports.RoleController = RoleController;
exports.roleController = new RoleController();

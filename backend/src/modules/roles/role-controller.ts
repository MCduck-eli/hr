import { Request, Response, NextFunction } from "express";
import { roleService } from "./role-service";

export class RoleController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await roleService.getAllRoles(req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await roleService.createRole(req.body, req.user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request<{ id: string }>, res: Response, next: NextFunction) {
        try {
            const result = await roleService.updateRole(req.params.id, req.body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request<{ id: string }>, res: Response, next: NextFunction) {
        try {
            const result = await roleService.deleteRole(req.params.id, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const roleController = new RoleController();

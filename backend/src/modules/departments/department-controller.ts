import { Request, Response, NextFunction } from "express";
import { departmentService } from "./department-service";

export class DepartmentController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await departmentService.createDepartment(req.body);
            res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await departmentService.getAllDepartments();
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getOne(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await departmentService.getDepartmentById(
                req.params.id,
            );
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const departmentController = new DepartmentController();

import { Request, Response, NextFunction } from "express";
import { departmentService } from "./department-service";

export class DepartmentController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await departmentService.createDepartment(
                req.body,
                (req as any).user,
            );
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
            const result = await departmentService.getAllDepartments(
                (req as any).user,
            );
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
                (req as any).user,
            );
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            await departmentService.deleteDepartment(
                req.params.id,
                (req as any).user,
            );
            res.status(200).json({
                status: "success",
                message: "Department deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}

export const departmentController = new DepartmentController();

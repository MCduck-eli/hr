import { Request, Response, NextFunction } from "express";
import { employeeStatusService } from "./employee-status-service";

export class EmployeeStatusController {
    async getAllStatuses(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await employeeStatusService.getAllStatuses(
                (req as any).user,
            );
            res.status(200).json({ status: "success", data });
        } catch (error) {
            next(error);
        }
    }

    async createStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await employeeStatusService.createStatus(
                req.body,
                (req as any).user,
            );
            res.status(201).json({ status: "success", data });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await employeeStatusService.updateStatus(
                req.params.id,
                req.body,
                (req as any).user,
            );
            res.status(200).json({ status: "success", data });
        } catch (error) {
            next(error);
        }
    }

    async deleteStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await employeeStatusService.deleteStatus(
                req.params.id,
                (req as any).user,
            );
            res.status(200).json({ status: "success", data });
        } catch (error) {
            next(error);
        }
    }
}

export const employeeStatusController = new EmployeeStatusController();

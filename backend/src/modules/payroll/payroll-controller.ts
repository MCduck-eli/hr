import { Request, Response, NextFunction } from "express";
import { PayrollStatus } from "@prisma/client";
import { payrollService } from "./payroll-service";

export class PayrollController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.createPayroll(req.body);
            res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getMyPayrolls(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.getMyPayrolls(req.user!.id);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllPayrolls(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.getAllPayrolls(
                req.query as any,
            );
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await payrollService.updateStatus(
                req.params.id,
                req.body.status as PayrollStatus,
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

export const payrollController = new PayrollController();

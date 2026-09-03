import { Request, Response, NextFunction } from "express";
import { PayrollStatus } from "@prisma/client";
import { payrollService } from "./payroll-service";

export class PayrollController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.createPayroll(req.body, (req as any).user);
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
            const result = await payrollService.getMyPayrolls((req as any).user.id);
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

    async calculateAuto(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.calculateAutoPayroll(
                req.body,
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

    async generateBatch(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.generateBatchPayroll(
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

    async updateStatus(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await payrollService.updateStatus(
                req.params.id,
                req.body.status as PayrollStatus,
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

    async deletePayroll(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            await payrollService.deletePayroll(
                req.params.id,
                (req as any).user,
            );
            res.status(200).json({
                status: "success",
                message: "Payroll deleted",
            });
        } catch (error) {
            next(error);
        }
    }
}

export const payrollController = new PayrollController();

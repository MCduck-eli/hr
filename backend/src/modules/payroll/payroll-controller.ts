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

    async getPenaltyRules(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.getPenaltyRules((req as any).user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async createPenaltyRule(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.createPenaltyRule(req.body, (req as any).user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updatePenaltyRule(req: Request<{ id: string }>, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.updatePenaltyRule(req.params.id, req.body, (req as any).user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async deletePenaltyRule(req: Request<{ id: string }>, res: Response, next: NextFunction) {
        try {
            await payrollService.deletePenaltyRule(req.params.id, (req as any).user);
            res.status(200).json({
                status: "success",
                message: "Penalty rule deleted",
            });
        } catch (error) {
            next(error);
        }
    }

    async getEmployeePenalties(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.getEmployeePenalties(req.query as any, (req as any).user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getPenaltiesSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.getPenaltiesSummary(req.query as any, (req as any).user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async createEmployeePenalty(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.createEmployeePenalty(req.body, (req as any).user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteEmployeePenalty(req: Request<{ id: string }>, res: Response, next: NextFunction) {
        try {
            await payrollService.deleteEmployeePenalty(req.params.id, (req as any).user);
            res.status(200).json({
                status: "success",
                message: "Employee penalty deleted",
            });
        } catch (error) {
            next(error);
        }
    }

    async getSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.getPayrollSchedule((req as any).user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.updatePayrollSchedule(req.body, (req as any).user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAdvances(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.getAdvances(req.query as any, (req as any).user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async createAdvance(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.createAdvance(req.body, (req as any).user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateAdvanceStatus(req: Request<{ id: string }>, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.updateAdvanceStatus(req.params.id, req.body, (req as any).user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteAdvance(req: Request<{ id: string }>, res: Response, next: NextFunction) {
        try {
            await payrollService.deleteAdvance(req.params.id, (req as any).user);
            res.status(200).json({
                status: "success",
                message: "Advance deleted",
            });
        } catch (error) {
            next(error);
        }
    }

    async paySalary(req: Request<{ id: string }>, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.paySalary(req.params.id, req.body, (req as any).user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getPaymentRecords(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.getPaymentRecords(req.query as any, (req as any).user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async deletePaymentRecord(req: Request<{ id: string }>, res: Response, next: NextFunction) {
        try {
            await payrollService.deletePaymentRecord(req.params.id, (req as any).user);
            res.status(200).json({
                status: "success",
                message: "Payment record deleted",
            });
        } catch (error) {
            next(error);
        }
    }

    async checkDueReminders(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await payrollService.checkAndNotifyDuePayments((req as any).user);
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

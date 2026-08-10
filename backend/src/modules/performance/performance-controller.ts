import { Request, Response, NextFunction } from "express";
import { performanceService } from "./performance-service";

export class PerformanceController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await performanceService.createReview(
                req.user!.id,
                req.body,
            );
            res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getMyReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await performanceService.getMyReviews(req.user!.id);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getEmployeeReviews(
        req: Request<{ employeeId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await performanceService.getEmployeeReviews(
                req.params.employeeId,
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

export const performanceController = new PerformanceController();

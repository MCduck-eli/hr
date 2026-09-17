import { Request, Response, NextFunction } from "express";
import { analyticsService } from "./analytics-service";

export class AnalyticsController {
    async getExecutiveSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await analyticsService.getExecutiveSummary(
                req.query as any,
                (req as any).user,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getNineBoxGrid(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await analyticsService.getNineBoxGrid(
                req.query as any,
                (req as any).user,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const analyticsController = new AnalyticsController();

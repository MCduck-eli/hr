import { Request, Response, NextFunction } from "express";
import { enpsService } from "./enps-service";

export class EnpsController {
    async getQuestions(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const companyName = user?.companyName || null;
            const activeOnly = req.query.activeOnly === "true";
            const result = await enpsService.getQuestions(companyName, activeOnly);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async createQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const companyName = user?.companyName || null;
            const result = await enpsService.createQuestion(companyName, req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const companyName = user?.companyName || null;
            const { id } = req.params;
            const result = await enpsService.updateQuestion(id, companyName, req.body);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async deleteQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const companyName = user?.companyName || null;
            const { id } = req.params;
            const result = await enpsService.deleteQuestion(id, companyName);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async submitEnps(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const result = await enpsService.submitEnps(user.id, req.body);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getMyLatestEnps(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const questionId = req.query.questionId as string | undefined;
            const result = await enpsService.getMyLatestEnps(user.id, questionId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getEnpsAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const companyName = user?.companyName || null;
            const result = await enpsService.getEnpsAnalytics(companyName);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const enpsController = new EnpsController();

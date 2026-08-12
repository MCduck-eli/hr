import { Request, Response, NextFunction } from "express";
import { discService } from "./disc-service";

export class DiscController {
    async createQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await discService.createQuestion(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getQuestions(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await discService.getQuestions();
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async submitAssessment(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await discService.submitAssessment(
                userId,
                req.body.answers,
            );
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getMyDiscProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await discService.getMyDiscProfile(userId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getTeamDiscAnalytics(
        req: Request,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const departmentId = req.query.departmentId as string | undefined;
            const result = await discService.getTeamDiscAnalytics(departmentId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const discController = new DiscController();

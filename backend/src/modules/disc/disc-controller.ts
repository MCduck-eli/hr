import { Request, Response, NextFunction } from "express";
import { discService } from "./disc-service";

export class DiscController {
    async createQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = (req as any).user;
            const result = await discService.createQuestion(req.body, currentUser);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = (req as any).user;
            const result = await discService.updateQuestion(req.params.id, req.body, currentUser);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async deleteQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = (req as any).user;
            const result = await discService.deleteQuestion(req.params.id, currentUser);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getQuestions(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = (req as any).user;
            const result = await discService.getQuestions(currentUser);
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
            const currentUser = (req as any).user;
            const result = await discService.getTeamDiscAnalytics(departmentId, currentUser);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const discController = new DiscController();

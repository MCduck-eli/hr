import { Request, Response, NextFunction } from "express";
import { feedback360Service } from "./feedback360-service";

export class Feedback360Controller {
    async createCycle(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await feedback360Service.createCycle(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getCycles(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await feedback360Service.getCycles();
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async assignReviewers(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await feedback360Service.assignReviewers(
                req.body.cycleId,
                req.body.targetId,
                req.body.reviewers,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getMyPendingTasks(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await feedback360Service.getMyPendingTasks(userId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async submitFeedback(
        req: Request<{ assignmentId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const userId = (req as any).user.id;
            const result = await feedback360Service.submitFeedback(
                req.params.assignmentId,
                userId,
                req.body.answers,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getTargetReport(
        req: Request<{ employeeId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const cycleId = req.query.cycleId as string;
            const result = await feedback360Service.getTargetReport(
                req.params.employeeId,
                cycleId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const feedback360Controller = new Feedback360Controller();

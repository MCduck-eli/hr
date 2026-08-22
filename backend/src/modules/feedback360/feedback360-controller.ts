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

    async updateCycle(req: Request<{ id: string }>, res: Response, next: NextFunction) {
        try {
            const result = await feedback360Service.updateCycle(req.params.id, req.body);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async deleteCycle(req: Request<{ id: string }>, res: Response, next: NextFunction) {
        try {
            const result = await feedback360Service.deleteCycle(req.params.id);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAssignments(req: Request, res: Response, next: NextFunction) {
        try {
            const cycleId = req.query.cycleId as string;
            const targetId = req.query.targetId as string;
            const result = await feedback360Service.getAssignments(cycleId, targetId);
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
            const user = (req as any).user;
            let userId = user.id;

            if (req.query.userId && (user.role === "SUPER_ADMIN" || user.role === "HR_ADMIN")) {
                userId = req.query.userId as string;
            }

            const result = await feedback360Service.getMyPendingTasks(userId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAssignmentById(req: Request<{ assignmentId: string }>, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const result = await feedback360Service.getAssignmentById(req.params.assignmentId, user.id, user.role);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async deleteAssignment(req: Request<{ assignmentId: string }>, res: Response, next: NextFunction) {
        try {
            const result = await feedback360Service.deleteAssignment(req.params.assignmentId);
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
            const userRole = (req as any).user.role;
            const result = await feedback360Service.submitFeedback(
                req.params.assignmentId,
                userId,
                userRole,
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
            const user = (req as any).user;
            const result = await feedback360Service.getTargetReport(
                req.params.employeeId,
                cycleId,
                user.id,
                user.role
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const feedback360Controller = new Feedback360Controller();

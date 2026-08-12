import { Request, Response, NextFunction } from "express";
import { okrService } from "./okr-service";

export class OkrController {
    async createCycle(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await okrService.createCycle(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getCycles(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await okrService.getCycles();
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async createObjective(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await okrService.createObjective(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async checkInKeyResult(
        req: Request<{ keyResultId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const userId = (req as any).user.id;
            const result = await okrService.checkInKeyResult(
                req.params.keyResultId,
                req.body.value,
                req.body.comment,
                userId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateObjectiveStatus(
        req: Request<{ objectiveId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await okrService.updateObjectiveStatus(
                req.params.objectiveId,
                req.body.status,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getDashboard(req: Request, res: Response, next: NextFunction) {
        try {
            const cycleId = req.query.cycleId as string | undefined;
            const departmentId = req.query.departmentId as string | undefined;
            const result = await okrService.getDashboard(cycleId, departmentId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const okrController = new OkrController();

import { Request, Response, NextFunction } from "express";
import { trialService } from "./trial-service";

export class TrialController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await trialService.createTrialRequest(req.body);
            res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await trialService.getAllTrialRequests();
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async approve(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await trialService.approveTrialRequest(id);
            res.status(200).json({
                status: "success",
                message: "Mijoz tasdiqlandi va parol pochtaga yuborildi",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async reject(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await trialService.rejectTrialRequest(id);
            res.status(200).json({
                status: "success",
                message: "Mijoz so'rovi rad etildi",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const trialController = new TrialController();

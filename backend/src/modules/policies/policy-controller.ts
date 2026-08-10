import { Request, Response, NextFunction } from "express";
import { policyService } from "./policy-service";

export class PolicyController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await policyService.createPolicy(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await policyService.getAllPolicies(userId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async sign(
        req: Request<{ policyId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const userId = (req as any).user.id;
            const result = await policyService.signPolicy(
                userId,
                req.params.policyId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const policyController = new PolicyController();

import { Request, Response, NextFunction } from "express";
import { policyService } from "./policy-service";

export class PolicyController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            let documentUrl = req.body.documentUrl;
            if (req.file) {
                documentUrl = `/uploads/${req.file.filename}`;
            }

            const isRequired =
                req.body.isRequired !== undefined
                    ? req.body.isRequired === "true" || req.body.isRequired === true
                    : true;

            const loggedInUserId = (req as any).user?.id;

            const result = await policyService.createPolicy(
                {
                    title: req.body.title,
                    description: req.body.description,
                    content: req.body.content,
                    documentUrl,
                    isRequired,
                    parentId: req.body.parentId,
                },
                loggedInUserId,
            );

            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { policyId } = req.params;
            const loggedInUserId = (req as any).user?.id;
            let documentUrl = req.body.documentUrl;
            if (req.file) {
                documentUrl = `/uploads/${req.file.filename}`;
            }

            const payload: any = {};
            if (req.body.title !== undefined) payload.title = req.body.title;
            if (req.body.description !== undefined) payload.description = req.body.description;
            if (req.body.content !== undefined) payload.content = req.body.content;
            if (documentUrl !== undefined) payload.documentUrl = documentUrl;
            if (req.body.isRequired !== undefined) {
                payload.isRequired =
                    req.body.isRequired === "true" || req.body.isRequired === true;
            }

            const result = await policyService.updatePolicy(
                policyId,
                payload,
                loggedInUserId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { policyId } = req.params;
            await policyService.deletePolicy(policyId);
            res.status(200).json({
                status: "success",
                message: "Nizom muvaffaqiyatli o'chirildi",
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const loggedInUserId = (req as any).user?.id;
            const targetUserId = req.query.userId ? String(req.query.userId) : loggedInUserId;
            const { policyId } = req.params;
            const result = await policyService.getPolicyById(policyId, targetUserId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const loggedInUserId = (req as any).user.id;
            const role = (req as any).user.role;
            const targetUserId = req.query.userId ? String(req.query.userId) : loggedInUserId;
            const search = req.query.search ? String(req.query.search) : undefined;
            const result = await policyService.getAllPolicies(targetUserId, role, search);
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
            const loggedInUserId = (req as any).user.id;
            const targetUserId = req.body.userId ? String(req.body.userId) : loggedInUserId;
            const result = await policyService.signPolicy(
                targetUserId,
                req.params.policyId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const policyController = new PolicyController();

import { Request, Response, NextFunction } from "express";
import { policyService } from "./policy-service";
import prisma from "../../config/db";

const getCompanyId = async (req: Request): Promise<string | null> => {
    const user = (req as any).user;
    if (!user) return null;
    let companyId = user.companyId || user.companyName;
    if (!companyId && user.id) {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { companyName: true },
        });
        companyId = (dbUser as any)?.companyId || dbUser?.companyName;
    }
    return companyId || null;
};

export class PolicyController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = (req as any).user;
            if (!currentUser) {
                return res.status(401).json({ status: "fail", message: "Unauthorized access" });
            }

            const companyId = await getCompanyId(req);
            if (!companyId) {
                return res.status(403).json({
                    status: "fail",
                    message: "Kompaniya identifikatori topilmadi",
                });
            }

            let documentUrl = req.body.documentUrl;
            if (req.file) {
                documentUrl = `/uploads/${req.file.filename}`;
            }

            const isRequired =
                req.body.isRequired !== undefined
                    ? req.body.isRequired === "true" || req.body.isRequired === true
                    : true;

            const loggedInUserId = currentUser.id;

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
                companyId,
            );

            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = (req as any).user;
            if (!currentUser) {
                return res.status(401).json({ status: "fail", message: "Unauthorized access" });
            }

            const companyId = await getCompanyId(req);
            if (!companyId) {
                return res.status(403).json({
                    status: "fail",
                    message: "Kompaniya identifikatori topilmadi",
                });
            }

            const policyId = String(req.params.policyId);
            const loggedInUserId = currentUser.id;
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
                companyId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = (req as any).user;
            if (!currentUser) {
                return res.status(401).json({ status: "fail", message: "Unauthorized access" });
            }

            const companyId = await getCompanyId(req);
            if (!companyId) {
                return res.status(403).json({
                    status: "fail",
                    message: "Kompaniya identifikatori topilmadi",
                });
            }

            const policyId = String(req.params.policyId);
            await policyService.deletePolicy(policyId, companyId);
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
            const currentUser = (req as any).user;
            if (!currentUser) {
                return res.status(401).json({ status: "fail", message: "Unauthorized access" });
            }

            const companyId = await getCompanyId(req);
            if (!companyId) {
                return res.status(403).json({
                    status: "fail",
                    message: "Kompaniya identifikatori topilmadi",
                });
            }

            const loggedInUserId = currentUser.id;
            const targetUserId = req.query.userId ? String(req.query.userId) : loggedInUserId;
            const policyId = String(req.params.policyId);
            const result = await policyService.getPolicyById(policyId, targetUserId, companyId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = (req as any).user;
            if (!currentUser) {
                return res.status(401).json({ status: "fail", message: "Unauthorized access" });
            }

            const companyId = await getCompanyId(req);
            if (!companyId) {
                return res.status(403).json({
                    status: "fail",
                    message: "Kompaniya identifikatori topilmadi",
                });
            }

            const loggedInUserId = currentUser.id;
            const role = currentUser.role;
            const targetUserId = req.query.userId ? String(req.query.userId) : loggedInUserId;
            const search = req.query.search ? String(req.query.search) : undefined;
            const result = await policyService.getAllPolicies(targetUserId, role, search, companyId);
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
            const currentUser = (req as any).user;
            if (!currentUser) {
                return res.status(401).json({ status: "fail", message: "Unauthorized access" });
            }

            const companyId = await getCompanyId(req);
            if (!companyId) {
                return res.status(403).json({
                    status: "fail",
                    message: "Kompaniya identifikatori topilmadi",
                });
            }

            const loggedInUserId = currentUser.id;
            const targetUserId = req.body.userId ? String(req.body.userId) : loggedInUserId;
            const policyId = String(req.params.policyId);
            const result = await policyService.signPolicy(
                targetUserId,
                policyId,
                companyId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const policyController = new PolicyController();

import { Request, Response, NextFunction } from "express";
import { CandidatePipelineStage } from "@prisma/client";
import { recruitmentService } from "./recruitment-service";

export class RecruitmentController {
    async createVacancy(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await recruitmentService.createVacancy(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateVacancy(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await recruitmentService.updateVacancy(req.params.id, req.body);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async deleteVacancy(req: Request, res: Response, next: NextFunction) {
        try {
            await recruitmentService.deleteVacancy(req.params.id);
            res.status(200).json({ status: "success", message: "Vacancy deleted" });
        } catch (error) {
            next(error);
        }
    }

    async getAllVacancies(req: Request, res: Response, next: NextFunction) {
        try {
            const vacancies = await recruitmentService.getAllVacancies();
            res.status(200).json({ status: "success", data: vacancies });
        } catch (error) {
            next(error);
        }
    }

    async getPublicVacancy(req: Request, res: Response, next: NextFunction) {
        try {
            const vacancy = await recruitmentService.getPublicVacancy(req.params.id);
            res.status(200).json({ status: "success", data: vacancy });
        } catch (error) {
            next(error);
        }
    }

    async applyCandidate(req: Request, res: Response, next: NextFunction) {
        try {
            const resumeUrl = req.file
                ? `/uploads/resumes/${req.file.filename}`
                : req.body.resumeUrl;

            const candidate = await recruitmentService.applyCandidate({
                ...req.body,
                resumeUrl,
            });
            res.status(201).json({ status: "success", data: candidate });
        } catch (error) {
            next(error);
        }
    }

    async getCandidateDetails(
        req: Request<{ candidateId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await recruitmentService.getCandidateDetails(
                req.params.candidateId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateStage(
        req: Request<{ candidateId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await recruitmentService.updateStage(
                req.params.candidateId,
                req.body.stage as CandidatePipelineStage,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async addFeedback(
        req: Request<{ candidateId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const userId = (req as any).user.id;
            const result = await recruitmentService.addFeedback(
                req.params.candidateId,
                userId,
                req.body,
            );
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
    async hireCandidate(
        req: Request<{ candidateId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await recruitmentService.hireCandidate(
                req.params.candidateId,
                req.body,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async sendEmail(
        req: Request<{ candidateId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await recruitmentService.sendCandidateEmail(
                req.params.candidateId,
                req.body,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const recruitmentController = new RecruitmentController();

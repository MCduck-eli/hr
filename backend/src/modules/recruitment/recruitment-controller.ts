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
            const deadline = req.body.testTaskDeadline
                ? new Date(req.body.testTaskDeadline)
                : req.body.testTaskDeadline === null
                ? null
                : undefined;

            const result = await recruitmentService.updateStage(
                req.params.candidateId,
                req.body.stage as CandidatePipelineStage,
                deadline,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getPublicCandidateTask(
        req: Request<{ candidateId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await recruitmentService.getPublicCandidateTask(
                req.params.candidateId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async submitPublicCandidateTask(
        req: Request<{ candidateId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const submissionFile = req.file
                ? `/uploads/tasks/${req.file.filename}`
                : req.body.submissionFile;

            const result = await recruitmentService.submitPublicCandidateTask(
                req.params.candidateId,
                {
                    submissionUrl: req.body.submissionUrl,
                    submissionFile,
                    submissionNote: req.body.submissionNote,
                },
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

    async uploadTaskFile(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                return res.status(400).json({ status: "fail", message: "Fayl tanlanmadi" });
            }
            const fileUrl = `/uploads/tasks/${req.file.filename}`;
            res.status(200).json({
                status: "success",
                data: {
                    fileUrl,
                    fileName: req.file.originalname,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async reverseGeocode(req: Request, res: Response, next: NextFunction) {
        try {
            const { lat, lon } = req.query;
            if (!lat || !lon) {
                return res.status(400).json({ status: "fail", message: "lat and lon are required" });
            }
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
                {
                    headers: {
                        "User-Agent": "HRPlatform-Recruiting/1.0 (contact@hrplatform.com)",
                        "Accept-Language": "uz,ru,en;q=0.9",
                    },
                }
            );
            const data: any = await response.json();
            const address = data.display_name || "";
            res.status(200).json({ status: "success", data: { address, raw: data } });
        } catch (error) {
            next(error);
        }
    }

    async searchLocation(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query.q as string;
            if (!query || query.length < 2) {
                return res.status(200).json({ status: "success", data: [] });
            }
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=uz&limit=5&addressdetails=1`,
                {
                    headers: {
                        "User-Agent": "HRPlatform-Recruiting/1.0 (contact@hrplatform.com)",
                        "Accept-Language": "uz,ru,en;q=0.9",
                    },
                }
            );
            const data: any = await response.json();
            const results = (Array.isArray(data) ? data : []).map((item: any) => ({
                displayName: item.display_name,
                lat: item.lat,
                lon: item.lon,
            }));
            res.status(200).json({ status: "success", data: results });
        } catch (error) {
            next(error);
        }
    }
}

export const recruitmentController = new RecruitmentController();

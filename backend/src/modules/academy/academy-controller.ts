import { Request, Response, NextFunction } from "express";
import { academyService } from "./academy-service";

export class AcademyController {
    async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await academyService.createCategory(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAllCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await academyService.getAllCategories();
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async createCourse(req: Request, res: Response, next: NextFunction) {
        try {
            const files = (req as any).files as {
                [fieldname: string]: any[];
            };
            const coverUrl = files?.cover
                ? `/uploads/${files.cover[0].filename}`
                : undefined;
            const videoUrl = files?.video
                ? `/uploads/${files.video[0].filename}`
                : undefined;

            const payload = {
                ...req.body,
                isRequired:
                    req.body.isRequired === "true" ||
                    req.body.isRequired === true,
                coverUrl,
                videoUrl,
            };

            const result = await academyService.createCourse(payload);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async deleteCourse(
        req: Request<{ courseId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await academyService.deleteCourse(
                req.params.courseId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async addLesson(
        req: Request<{ courseId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await academyService.addLesson(
                req.params.courseId,
                req.body,
            );
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async addResource(
        req: Request<{ courseId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await academyService.addResource(
                req.params.courseId,
                req.body,
            );
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async addQuiz(
        req: Request<{ courseId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await academyService.addQuiz(
                req.params.courseId,
                req.body,
            );
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAllCourses(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const categoryId = req.query.categoryId as string | undefined;
            const result = await academyService.getAllCourses(
                userId,
                categoryId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getCourseDetails(
        req: Request<{ courseId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await academyService.getCourseDetails(
                req.params.courseId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async submitQuiz(
        req: Request<{ courseId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const userId = (req as any).user.id;
            const result = await academyService.submitQuiz(
                userId,
                req.params.courseId,
                req.body.answers,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async createEvent(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await academyService.createEvent(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getEvents(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await academyService.getEvents(userId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async registerEvent(
        req: Request<{ eventId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const userId = (req as any).user.id;
            const result = await academyService.registerEvent(
                userId,
                req.params.eventId,
            );
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getMyCertificates(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await academyService.getMyCertificates(userId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateCourse(
        req: Request<{ courseId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const files = (req as any).files as {
                [fieldname: string]: any[];
            };
            const updateData: any = { ...req.body };

            if (req.body.isRequired !== undefined) {
                updateData.isRequired =
                    req.body.isRequired === "true" ||
                    req.body.isRequired === true;
            }
            if (files?.cover) {
                updateData.coverUrl = `/uploads/${files.cover[0].filename}`;
            }
            if (files?.video) {
                updateData.videoUrl = `/uploads/${files.video[0].filename}`;
            }

            const result = await academyService.updateCourse(
                req.params.courseId,
                updateData,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async assignAcademy(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await academyService.assignAcademy(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAssignedEmployees(
        req: Request,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await academyService.getAssignedEmployees();
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const academyController = new AcademyController();

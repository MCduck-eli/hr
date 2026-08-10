import { Request, Response, NextFunction } from "express";
import { academyService } from "./academy-service";

export class AcademyController {
    async createCourse(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await academyService.createCourse(req.body);
            res.status(201).json({ status: "success", data: result });
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
            const result = await academyService.getAllCourses(userId);
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
}

export const academyController = new AcademyController();

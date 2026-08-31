import { Request, Response, NextFunction } from "express";
import { gradingService } from "./grading-service";

export class GradingController {
    async createGrade(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await gradingService.createGrade(
                req.body,
                (req as any).user,
            );
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getGrades(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await gradingService.getGrades((req as any).user);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateGrade(req: Request<{ gradeId: string }>, res: Response, next: NextFunction) {
        try {
            const result = await gradingService.updateGrade(
                req.params.gradeId,
                req.body,
                (req as any).user,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async deleteGrade(req: Request<{ gradeId: string }>, res: Response, next: NextFunction) {
        try {
            const result = await gradingService.deleteGrade(
                req.params.gradeId,
                (req as any).user,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getEmployeesWithGrades(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await gradingService.getEmployeesWithGrades((req as any).user);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getPromotionRequests(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await gradingService.getPromotionRequests((req as any).user);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async assignGradeToEmployee(
        req: Request<{ employeeId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await gradingService.assignGradeToEmployee(
                req.params.employeeId,
                req.body.gradeId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async createPromotionRequest(
        req: Request,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await gradingService.createPromotionRequest(
                req.body,
                (req as any).user,
            );
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async processPromotionApproval(
        req: Request<{ requestId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const userRole = (req as any).user.role;
            const result = await gradingService.processPromotionApproval(
                req.params.requestId,
                userRole,
                req.body.action,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getCareerHistory(
        req: Request<{ employeeId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await gradingService.getCareerHistory(
                req.params.employeeId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const gradingController = new GradingController();

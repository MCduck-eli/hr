import { Request, Response, NextFunction } from "express";
import { TaskStatus } from "@prisma/client";
import { onboardingService } from "./onboarding-service";

export class OnboardingController {
    async createTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await onboardingService.createTemplate(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async assignOnboarding(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await onboardingService.assignOnboarding(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getMyOnboarding(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const employee = await (req as any).prisma?.employee.findUnique({
                where: { userId },
            });
            const result = await onboardingService.getEmployeeOnboarding(
                employee?.id || req.params.employeeId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateTaskStatus(
        req: Request<{ taskId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await onboardingService.updateTaskStatus(
                req.params.taskId,
                req.body.status as TaskStatus,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async completeCourse(
        req: Request<{ courseId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await onboardingService.completeCourse(
                req.params.courseId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getHRMonitoring(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await onboardingService.getHRDashboardMonitoring();
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const onboardingController = new OnboardingController();

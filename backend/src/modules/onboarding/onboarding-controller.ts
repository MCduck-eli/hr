import { Request, Response, NextFunction } from "express";
import { TaskStatus } from "@prisma/client";
import { onboardingService } from "./onboarding-service";
import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class OnboardingController {
    async createTemplate(req: Request, res: Response, next: NextFunction) {
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

            const result = await onboardingService.createTemplate(payload);
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
            const employee = await prisma.employee.findUnique({
                where: { userId },
            });

            const paramEmployeeId = req.params.employeeId;
            const employeeIdParam = Array.isArray(paramEmployeeId)
                ? paramEmployeeId[0]
                : paramEmployeeId;

            const targetId = employee?.id || employeeIdParam;

            if (!targetId) {
                throw new AppError("Employee ID not found", 400);
            }

            const result =
                await onboardingService.getEmployeeOnboarding(targetId);
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

    async getAllTemplates(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await onboardingService.getAllTemplates();
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateTemplate(
        req: Request<{ templateId: string }>,
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

            const result = await onboardingService.updateTemplate(
                req.params.templateId,
                updateData,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async deleteTemplate(
        req: Request<{ templateId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await onboardingService.deleteTemplate(
                req.params.templateId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const onboardingController = new OnboardingController();

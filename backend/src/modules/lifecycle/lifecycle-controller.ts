import { Request, Response, NextFunction } from "express";
import { lifecycleService } from "./lifecycle-service";

export class LifecycleController {
    async createTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await lifecycleService.createTemplate(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getTemplates(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await lifecycleService.getTemplates();
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async applyTemplateToEmployee(
        req: Request<{ employeeId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await lifecycleService.applyTemplateToEmployee(
                req.params.employeeId,
                req.body.templateId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateChecklistStatus(
        req: Request<{ checklistId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await lifecycleService.updateChecklistStatus(
                req.params.checklistId,
                req.body.status,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getEmployeeJourney(
        req: Request<{ employeeId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const startDate = req.query.startDate as string | undefined;
            const endDate = req.query.endDate as string | undefined;
            const eventType = req.query.eventType as string | undefined;

            const result = await lifecycleService.getEmployeeJourney(
                req.params.employeeId,
                {
                    startDate,
                    endDate,
                    eventType,
                },
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async startOffboarding(
        req: Request<{ employeeId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await lifecycleService.startOffboarding(
                req.params.employeeId,
                req.body,
            );
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
    async getOffboardingDetails(
        req: Request<{ employeeId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await lifecycleService.getOffboardingDetails(
                req.params.employeeId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateOffboardingTask(
        req: Request<{ taskId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await lifecycleService.updateOffboardingTask(
                req.params.taskId,
                req.body.isCompleted,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
    async exportEmployeeJourney(
        req: Request<{ employeeId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const startDate = req.query.startDate as string | undefined;
            const endDate = req.query.endDate as string | undefined;
            const eventType = req.query.eventType as string | undefined;

            const { filename, csvContent } =
                await lifecycleService.exportEmployeeJourneyCSV(
                    req.params.employeeId,
                    { startDate, endDate, eventType },
                );

            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${filename}"`,
            );
            res.status(200).send("\uFEFF" + csvContent); // BOM for Excel encoding
        } catch (error) {
            next(error);
        }
    }
}

export const lifecycleController = new LifecycleController();

import { Request, Response, NextFunction } from "express";
import { orgChartService } from "./org-chart-service";

export class OrgChartController {
    async getOrgTree(req: Request, res: Response, next: NextFunction) {
        try {
            const departmentId = req.query.departmentId as string | undefined;
            const search = req.query.search as string | undefined;
            const result = await orgChartService.getOrgTree(
                departmentId,
                search,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getMyOrgContext(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await orgChartService.getMyOrgContext(userId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateEmployeeHierarchy(
        req: Request<{ employeeId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const changedByUserId = (req as any).user.id;
            const result = await orgChartService.updateEmployeeHierarchy(
                req.params.employeeId,
                changedByUserId,
                req.body,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getOrgHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const employeeId = req.query.employeeId as string | undefined;
            const result = await orgChartService.getOrgHistory(employeeId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const orgChartController = new OrgChartController();

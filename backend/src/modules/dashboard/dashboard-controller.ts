import { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard-service";

export class DashboardController {
    async getEmployeeDashboard(
        req: Request,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const loggedInUserId = (req as any).user?.id;
            const role = (req as any).user?.role;

            if (!loggedInUserId) {
                return res
                    .status(401)
                    .json({ message: "Avtorizatsiyadan o'tilmagan" });
            }

            const privilegedRoles: string[] = ["SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"];

            const targetUserId =
                req.query.userId && privilegedRoles.includes(role)
                    ? String(req.query.userId)
                    : loggedInUserId;

            const data =
                await dashboardService.getEmployeeDashboardData(targetUserId, (req as any).user);

            res.status(200).json({
                status: "success",
                data,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProgress(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const userId = user?.id;

            if (!userId) {
                return res
                    .status(401)
                    .json({ message: "Avtorizatsiyadan o'tilmagan" });
            }

            const data = await dashboardService.updateVideoProgress(userId, req.body);

            res.status(200).json({
                status: "success",
                message: "Progress muvaffaqiyatli saqlandi",
                data,
            });
        } catch (error) {
            next(error);
        }
    }

    async getHRDashboardActivities(
        req: Request,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res
                    .status(401)
                    .json({ message: "Avtorizatsiyadan o'tilmagan" });
            }

            const data = await dashboardService.getHRDashboardActivities(userId);

            res.status(200).json({
                status: "success",
                data,
            });
        } catch (error) {
            next(error);
        }
    }

    async getHRDashboardSummary(
        req: Request,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res
                    .status(401)
                    .json({ message: "Avtorizatsiyadan o'tilmagan" });
            }

            const data = await dashboardService.getHRDashboardSummary(userId);

            res.status(200).json({
                status: "success",
                data,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardController = new DashboardController();

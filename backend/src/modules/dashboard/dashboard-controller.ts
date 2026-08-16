import { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard-service";

export class DashboardController {
    async getEmployeeDashboard(
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

            const data =
                await dashboardService.getEmployeeDashboardData(userId);

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
            const userId = (req as any).user?.id;

            if (!userId) {
                return res
                    .status(401)
                    .json({ message: "Avtorizatsiyadan o'tilmagan" });
            }

            await dashboardService.updateVideoProgress(userId, req.body);

            res.status(200).json({
                status: "success",
                message: "Progress muvaffaqiyatli saqlandi",
            });
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardController = new DashboardController();

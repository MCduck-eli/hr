"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const dashboard_service_1 = require("./dashboard-service");
class DashboardController {
    async getEmployeeDashboard(req, res, next) {
        try {
            const loggedInUserId = req.user?.id;
            const role = req.user?.role;
            if (!loggedInUserId) {
                return res
                    .status(401)
                    .json({ message: "Avtorizatsiyadan o'tilmagan" });
            }
            const targetUserId = req.query.userId &&
                (role === "SUPER_ADMIN" || role === "HR_ADMIN")
                ? String(req.query.userId)
                : loggedInUserId;
            const data = await dashboard_service_1.dashboardService.getEmployeeDashboardData(targetUserId);
            res.status(200).json({
                status: "success",
                data,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateProgress(req, res, next) {
        try {
            const user = req.user;
            const userId = user?.id;
            if (!userId) {
                return res
                    .status(401)
                    .json({ message: "Avtorizatsiyadan o'tilmagan" });
            }
            const data = await dashboard_service_1.dashboardService.updateVideoProgress(userId, req.body);
            res.status(200).json({
                status: "success",
                message: "Progress muvaffaqiyatli saqlandi",
                data,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getHRDashboardActivities(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res
                    .status(401)
                    .json({ message: "Avtorizatsiyadan o'tilmagan" });
            }
            const data = await dashboard_service_1.dashboardService.getHRDashboardActivities(userId);
            res.status(200).json({
                status: "success",
                data,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getHRDashboardSummary(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res
                    .status(401)
                    .json({ message: "Avtorizatsiyadan o'tilmagan" });
            }
            const data = await dashboard_service_1.dashboardService.getHRDashboardSummary(userId);
            res.status(200).json({
                status: "success",
                data,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics-service");
class AnalyticsController {
    async getExecutiveSummary(req, res, next) {
        try {
            const result = await analytics_service_1.analyticsService.getExecutiveSummary(req.query, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getNineBoxGrid(req, res, next) {
        try {
            const result = await analytics_service_1.analyticsService.getNineBoxGrid(req.query, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AnalyticsController = AnalyticsController;
exports.analyticsController = new AnalyticsController();

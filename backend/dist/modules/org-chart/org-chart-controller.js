"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgChartController = exports.OrgChartController = void 0;
const org_chart_service_1 = require("./org-chart-service");
class OrgChartController {
    async getOrgTree(req, res, next) {
        try {
            const departmentId = req.query.departmentId;
            const search = req.query.search;
            const result = await org_chart_service_1.orgChartService.getOrgTree(departmentId, search, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyOrgContext(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await org_chart_service_1.orgChartService.getMyOrgContext(userId, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateEmployeeHierarchy(req, res, next) {
        try {
            const changedByUserId = req.user.id;
            const result = await org_chart_service_1.orgChartService.updateEmployeeHierarchy(req.params.employeeId, changedByUserId, req.body, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getOrgHistory(req, res, next) {
        try {
            const employeeId = req.query.employeeId;
            const result = await org_chart_service_1.orgChartService.getOrgHistory(employeeId, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OrgChartController = OrgChartController;
exports.orgChartController = new OrgChartController();

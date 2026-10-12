"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingController = exports.OnboardingController = void 0;
const onboarding_service_1 = require("./onboarding-service");
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
class OnboardingController {
    async createTemplate(req, res, next) {
        try {
            const files = req.files;
            const coverUrl = files?.cover
                ? `/uploads/${files.cover[0].filename}`
                : undefined;
            const videoUrl = files?.video
                ? `/uploads/${files.video[0].filename}`
                : undefined;
            const targetStatus = req.body.targetStatus === "ALL" ||
                !req.body.targetStatus ||
                req.body.targetStatus === "null" ||
                req.body.targetStatus === "undefined"
                ? null
                : req.body.targetStatus;
            const departmentId = req.body.departmentId &&
                req.body.departmentId !== "null" &&
                req.body.departmentId !== "undefined" &&
                req.body.departmentId !== ""
                ? req.body.departmentId
                : undefined;
            const payload = {
                ...req.body,
                isRequired: req.body.isRequired === "true" ||
                    req.body.isRequired === true,
                targetStatus,
                departmentId,
                coverUrl,
                videoUrl,
            };
            const result = await onboarding_service_1.onboardingService.createTemplate(payload, req.user);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async assignOnboarding(req, res, next) {
        try {
            const result = await onboarding_service_1.onboardingService.assignOnboarding(req.body);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyOnboarding(req, res, next) {
        try {
            const userId = req.user.id;
            const employee = await db_1.default.employee.findUnique({
                where: { userId },
            });
            const paramEmployeeId = req.params.employeeId;
            const employeeIdParam = Array.isArray(paramEmployeeId)
                ? paramEmployeeId[0]
                : paramEmployeeId;
            const targetId = employee?.id || employeeIdParam;
            if (!targetId) {
                throw new appError_1.AppError("Employee ID not found", 400);
            }
            const result = await onboarding_service_1.onboardingService.getEmployeeOnboarding(targetId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateTaskStatus(req, res, next) {
        try {
            const result = await onboarding_service_1.onboardingService.updateTaskStatus(req.params.taskId, req.body.status);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async completeCourse(req, res, next) {
        try {
            const user = req.user;
            if (user?.role === "SUPER_ADMIN" || user?.role === "HR_ADMIN") {
                return res.status(200).json({
                    status: "success",
                    data: null,
                    message: "Admin uchun progress yozilmaydi",
                });
            }
            const employee = await db_1.default.employee.findFirst({
                where: {
                    OR: [
                        ...(user?.id ? [{ userId: user.id }, { id: user.id }] : []),
                    ],
                },
            });
            const result = await onboarding_service_1.onboardingService.completeCourse(req.params.courseId, employee?.id);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getHRMonitoring(req, res, next) {
        try {
            const result = await onboarding_service_1.onboardingService.getHRDashboardMonitoring(req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllTemplates(req, res, next) {
        try {
            const result = await onboarding_service_1.onboardingService.getAllTemplates(req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateTemplate(req, res, next) {
        try {
            const files = req.files;
            const updateData = { ...req.body };
            if (req.body.isRequired !== undefined) {
                updateData.isRequired =
                    req.body.isRequired === "true" ||
                        req.body.isRequired === true;
            }
            if (req.body.targetStatus !== undefined) {
                updateData.targetStatus =
                    req.body.targetStatus === "ALL" ||
                        !req.body.targetStatus ||
                        req.body.targetStatus === "null" ||
                        req.body.targetStatus === "undefined"
                        ? null
                        : req.body.targetStatus;
            }
            if (req.body.departmentId !== undefined) {
                updateData.departmentId =
                    req.body.departmentId &&
                        req.body.departmentId !== "null" &&
                        req.body.departmentId !== "undefined" &&
                        req.body.departmentId !== ""
                        ? req.body.departmentId
                        : null;
            }
            if (files?.cover) {
                updateData.coverUrl = `/uploads/${files.cover[0].filename}`;
            }
            if (files?.video) {
                updateData.videoUrl = `/uploads/${files.video[0].filename}`;
            }
            const result = await onboarding_service_1.onboardingService.updateTemplate(req.params.templateId, updateData);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTemplate(req, res, next) {
        try {
            const result = await onboarding_service_1.onboardingService.deleteTemplate(req.params.templateId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OnboardingController = OnboardingController;
exports.onboardingController = new OnboardingController();

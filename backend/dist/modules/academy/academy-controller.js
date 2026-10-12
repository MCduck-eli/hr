"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academyController = exports.AcademyController = void 0;
const academy_service_1 = require("./academy-service");
class AcademyController {
    async createCategory(req, res, next) {
        try {
            const result = await academy_service_1.academyService.createCategory(req.body);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllCategories(req, res, next) {
        try {
            const result = await academy_service_1.academyService.getAllCategories();
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async createCourse(req, res, next) {
        try {
            const files = req.files;
            const coverUrl = files?.cover
                ? `/uploads/${files.cover[0].filename}`
                : undefined;
            const videoUrl = files?.video
                ? `/uploads/${files.video[0].filename}`
                : undefined;
            const payload = {
                ...req.body,
                isRequired: req.body.isRequired === "true" ||
                    req.body.isRequired === true,
                targetDepartmentId: req.body.targetDepartmentId || null,
                targetEmployeeId: req.body.targetEmployeeId || null,
                targetStatusConfigId: req.body.targetStatusConfigId || null,
                coverUrl,
                videoUrl,
            };
            const result = await academy_service_1.academyService.createCourse(payload, req.user);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteCourse(req, res, next) {
        try {
            const result = await academy_service_1.academyService.deleteCourse(req.params.courseId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async addLesson(req, res, next) {
        try {
            const result = await academy_service_1.academyService.addLesson(req.params.courseId, req.body);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async addResource(req, res, next) {
        try {
            const result = await academy_service_1.academyService.addResource(req.params.courseId, req.body);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async addQuiz(req, res, next) {
        try {
            const result = await academy_service_1.academyService.addQuiz(req.params.courseId, req.body);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllCourses(req, res, next) {
        try {
            const user = req.user;
            const categoryId = req.query.categoryId;
            const result = await academy_service_1.academyService.getAllCourses(user.id, user.role, categoryId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getCourseDetails(req, res, next) {
        try {
            const result = await academy_service_1.academyService.getCourseDetails(req.params.courseId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async submitQuiz(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await academy_service_1.academyService.submitQuiz(userId, req.params.courseId, req.body.answers);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async createEvent(req, res, next) {
        try {
            const result = await academy_service_1.academyService.createEvent(req.body);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getEvents(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await academy_service_1.academyService.getEvents(userId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async registerEvent(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await academy_service_1.academyService.registerEvent(userId, req.params.eventId);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyCertificates(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await academy_service_1.academyService.getMyCertificates(userId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateCourse(req, res, next) {
        try {
            const files = req.files;
            const updateData = { ...req.body };
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
            if (updateData.targetDepartmentId === "") {
                updateData.targetDepartmentId = null;
            }
            if (updateData.targetEmployeeId === "") {
                updateData.targetEmployeeId = null;
            }
            if (updateData.targetStatusConfigId === "") {
                updateData.targetStatusConfigId = null;
            }
            const result = await academy_service_1.academyService.updateCourse(req.params.courseId, updateData, req.user);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateProgress(req, res, next) {
        try {
            const userId = req.user?.id;
            const courseId = req.params.courseId || req.body.courseId || req.body.moduleId;
            const progressPercent = Math.round(Number(req.body.progressPercent ?? req.body.progress ?? req.body.progressPercentage ?? 0));
            const result = await academy_service_1.academyService.updateCourseProgress(userId, courseId, progressPercent);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AcademyController = AcademyController;
exports.academyController = new AcademyController();

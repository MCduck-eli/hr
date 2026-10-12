"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const academy_validation_1 = require("./academy-validation");
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth-middleware");
const academy_controller_1 = require("./academy-controller");
const validate_middleware_1 = require("../../middlewares/validate-middleware");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = "uploads/";
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    },
});
const upload = (0, multer_1.default)({ storage });
const academyRouter = (0, express_1.Router)();
academyRouter.use(auth_middleware_1.authenticate);
academyRouter.get("/categories", academy_controller_1.academyController.getAllCategories);
academyRouter.get("/courses", academy_controller_1.academyController.getAllCourses);
academyRouter.get("/courses/:courseId", academy_controller_1.academyController.getCourseDetails);
academyRouter.post("/courses/:courseId/submit-quiz", (0, validate_middleware_1.validate)(academy_validation_1.submitQuizSchema), academy_controller_1.academyController.submitQuiz);
academyRouter.get("/events", academy_controller_1.academyController.getEvents);
academyRouter.post("/events/:eventId/register", academy_controller_1.academyController.registerEvent);
academyRouter.get("/certificates/my", academy_controller_1.academyController.getMyCertificates);
academyRouter.patch("/courses/:courseId/progress", academy_controller_1.academyController.updateProgress);
academyRouter.patch("/progress", academy_controller_1.academyController.updateProgress);
academyRouter.post("/categories", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), (0, validate_middleware_1.validate)(academy_validation_1.createCategorySchema), academy_controller_1.academyController.createCategory);
academyRouter.post("/courses", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "video", maxCount: 1 },
]), academy_controller_1.academyController.createCourse);
academyRouter.delete("/courses/:courseId", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), academy_controller_1.academyController.deleteCourse);
academyRouter.post("/courses/:courseId/lessons", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), (0, validate_middleware_1.validate)(academy_validation_1.addLessonSchema), academy_controller_1.academyController.addLesson);
academyRouter.post("/courses/:courseId/resources", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), (0, validate_middleware_1.validate)(academy_validation_1.addResourceSchema), academy_controller_1.academyController.addResource);
academyRouter.post("/courses/:courseId/quizzes", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), academy_controller_1.academyController.addQuiz);
academyRouter.post("/events", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), (0, validate_middleware_1.validate)(academy_validation_1.createEventSchema), academy_controller_1.academyController.createEvent);
academyRouter.patch("/courses/:courseId", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "video", maxCount: 1 },
]), academy_controller_1.academyController.updateCourse);
exports.default = academyRouter;

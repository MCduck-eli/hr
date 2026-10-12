"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validate_middleware_1 = require("./../../middlewares/validate-middleware");
const auth_middleware_1 = require("./../../middlewares/auth-middleware");
const express_1 = require("express");
const onboarding_controller_1 = require("./onboarding-controller");
const onboarding_validation_1 = require("./onboarding-validation");
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
const onboardingRouter = (0, express_1.Router)();
onboardingRouter.use(auth_middleware_1.authenticate);
onboardingRouter.get("/my", onboarding_controller_1.onboardingController.getMyOnboarding);
onboardingRouter.patch("/tasks/:taskId", (0, validate_middleware_1.validate)(onboarding_validation_1.updateTaskStatusSchema), onboarding_controller_1.onboardingController.updateTaskStatus);
onboardingRouter.patch("/courses/:courseId/complete", onboarding_controller_1.onboardingController.completeCourse);
onboardingRouter.post("/templates", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "video", maxCount: 1 },
]), (0, validate_middleware_1.validate)(onboarding_validation_1.createTemplateSchema), onboarding_controller_1.onboardingController.createTemplate);
onboardingRouter.post("/assign", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), (0, validate_middleware_1.validate)(onboarding_validation_1.assignOnboardingSchema), onboarding_controller_1.onboardingController.assignOnboarding);
onboardingRouter.get("/monitoring", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), onboarding_controller_1.onboardingController.getHRMonitoring);
onboardingRouter.get("/templates", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), onboarding_controller_1.onboardingController.getAllTemplates);
onboardingRouter.patch("/templates/:templateId", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "video", maxCount: 1 },
]), onboarding_controller_1.onboardingController.updateTemplate);
onboardingRouter.delete("/templates/:templateId", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), onboarding_controller_1.onboardingController.deleteTemplate);
exports.default = onboardingRouter;

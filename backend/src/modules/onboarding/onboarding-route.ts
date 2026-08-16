import { validate } from "./../../middlewares/validate-middleware";
import { authenticate, authorize } from "./../../middlewares/auth-middleware";
import { Router } from "express";
import { onboardingController } from "./onboarding-controller";
import {
    assignOnboardingSchema,
    createTemplateSchema,
    updateTaskStatusSchema,
} from "./onboarding-validation";
import multer from "multer";
import fs from "fs";

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    },
});

const upload = multer({ storage });

const onboardingRouter = Router();

onboardingRouter.use(authenticate);

onboardingRouter.get("/my", onboardingController.getMyOnboarding);
onboardingRouter.patch(
    "/tasks/:taskId",
    validate(updateTaskStatusSchema),
    onboardingController.updateTaskStatus,
);
onboardingRouter.patch(
    "/courses/:courseId/complete",
    onboardingController.completeCourse,
);

onboardingRouter.post(
    "/templates",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    upload.fields([
        { name: "cover", maxCount: 1 },
        { name: "video", maxCount: 1 },
    ]),
    validate(createTemplateSchema),
    onboardingController.createTemplate,
);

onboardingRouter.post(
    "/assign",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(assignOnboardingSchema),
    onboardingController.assignOnboarding,
);

onboardingRouter.get(
    "/monitoring",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    onboardingController.getHRMonitoring,
);

onboardingRouter.get(
    "/templates",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    onboardingController.getAllTemplates,
);

onboardingRouter.patch(
    "/templates/:templateId",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    upload.fields([
        { name: "cover", maxCount: 1 },
        { name: "video", maxCount: 1 },
    ]),
    onboardingController.updateTemplate,
);

onboardingRouter.delete(
    "/templates/:templateId",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    onboardingController.deleteTemplate,
);

export default onboardingRouter;

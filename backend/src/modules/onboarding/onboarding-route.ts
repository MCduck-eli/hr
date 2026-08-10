import { validate } from "./../../middlewares/validate-middleware";
import { authenticate, authorize } from "./../../middlewares/auth-middleware";
import { Router } from "express";
import { onboardingController } from "./onboarding-controller";
import {
    assignOnboardingSchema,
    createTemplateSchema,
    updateTaskStatusSchema,
} from "./onboarding-validation";

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

export default onboardingRouter;

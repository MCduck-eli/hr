import { validate } from "./../../middlewares/validate-middleware";
import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { lifecycleController } from "./lifecycle-controller";
import {
    applyTemplateSchema,
    createTemplateSchema,
    updateChecklistStatusSchema,
    updateOffboardingTaskSchema,
} from "./lifecycle-validation";

const lifecycleRouter = Router();

lifecycleRouter.use(authenticate);

lifecycleRouter.get(
    "/templates",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    lifecycleController.getTemplates,
);

lifecycleRouter.post(
    "/templates",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(createTemplateSchema),
    lifecycleController.createTemplate,
);

lifecycleRouter.post(
    "/employee/:employeeId/apply-template",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(applyTemplateSchema),
    lifecycleController.applyTemplateToEmployee,
);

lifecycleRouter.patch(
    "/checklist/:checklistId/status",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(updateChecklistStatusSchema),
    lifecycleController.updateChecklistStatus,
);

lifecycleRouter.get(
    "/employee/:employeeId/journey",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    lifecycleController.getEmployeeJourney,
);

lifecycleRouter.post(
    "/employee/:employeeId/offboarding",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    lifecycleController.startOffboarding,
);

lifecycleRouter.get(
    "/employee/:employeeId/offboarding",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    lifecycleController.getOffboardingDetails,
);

lifecycleRouter.patch(
    "/offboarding/tasks/:taskId",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(updateOffboardingTaskSchema),
    lifecycleController.updateOffboardingTask,
);

lifecycleRouter.get(
    "/employee/:employeeId/journey/export",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    lifecycleController.exportEmployeeJourney,
);

export default lifecycleRouter;

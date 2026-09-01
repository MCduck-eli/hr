import { validate } from "./../../middlewares/validate-middleware";
import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { lifecycleController } from "./lifecycle-controller";
import {
    applyTemplateSchema,
    createTemplateSchema,
    updateChecklistStatusSchema,
    updateOffboardingTaskSchema,
    createLifecycleEventSchema,
    updateLifecycleEventSchema,
} from "./lifecycle-validation";

const lifecycleRouter = Router();

lifecycleRouter.use(authenticate);

lifecycleRouter.get(
    "/templates",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    lifecycleController.getTemplates,
);

lifecycleRouter.post(
    "/templates",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    validate(createTemplateSchema),
    lifecycleController.createTemplate,
);

lifecycleRouter.put(
    "/templates/:templateId",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    lifecycleController.updateTemplate,
);

lifecycleRouter.delete(
    "/templates/:templateId",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    lifecycleController.deleteTemplate,
);

lifecycleRouter.post(
    "/employee/:employeeId/apply-template",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    validate(applyTemplateSchema),
    lifecycleController.applyTemplateToEmployee,
);

lifecycleRouter.patch(
    "/checklist/:checklistId/status",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    validate(updateChecklistStatusSchema),
    lifecycleController.updateChecklistStatus,
);

lifecycleRouter.get(
    "/employee/:employeeId/journey",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN", "DEPARTMENT_HEAD", "EMPLOYEE"),
    lifecycleController.getEmployeeJourney,
);

lifecycleRouter.post(
    "/employee/:employeeId/events",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    validate(createLifecycleEventSchema),
    lifecycleController.createLifecycleEvent,
);

lifecycleRouter.put(
    "/events/:eventId",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    validate(updateLifecycleEventSchema),
    lifecycleController.updateLifecycleEvent,
);

lifecycleRouter.delete(
    "/events/:eventId",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    lifecycleController.deleteLifecycleEvent,
);

lifecycleRouter.get(
    "/offboarding",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    lifecycleController.getAllOffboarding,
);

lifecycleRouter.post(
    "/employee/:employeeId/offboarding",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    lifecycleController.startOffboarding,
);

lifecycleRouter.get(
    "/employee/:employeeId/offboarding",
    lifecycleController.getOffboardingDetails,
);

lifecycleRouter.patch(
    "/offboarding/tasks/:taskId",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    lifecycleController.updateOffboardingTask,
);

lifecycleRouter.put(
    "/offboarding/tasks/:taskId",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    lifecycleController.editOffboardingTask,
);

lifecycleRouter.post(
    "/offboarding/:offboardingId/tasks",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    lifecycleController.addOffboardingTask,
);

lifecycleRouter.delete(
    "/offboarding/tasks/:taskId",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    lifecycleController.deleteOffboardingTask,
);

lifecycleRouter.post(
    "/employee/:employeeId/exit-interview",
    lifecycleController.submitExitInterview,
);

lifecycleRouter.patch(
    "/offboarding/:offboardingId/status",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    lifecycleController.updateOffboardingStatus,
);

lifecycleRouter.get(
    "/employee/:employeeId/journey/export",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN", "DEPARTMENT_HEAD"),
    lifecycleController.exportEmployeeJourney,
);

export default lifecycleRouter;

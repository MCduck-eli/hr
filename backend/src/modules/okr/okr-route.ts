import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { validate } from "../../middlewares/validate-middleware";
import { okrController } from "./okr-controller";
import {
    checkInKeyResultSchema,
    createCycleSchema,
    createObjectiveSchema,
    updateOkrStatusSchema,
} from "./okr-validation";

const okrRouter = Router();

okrRouter.use(authenticate);

okrRouter.get("/cycles", okrController.getCycles);
okrRouter.post(
    "/cycles",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(createCycleSchema),
    okrController.createCycle,
);

okrRouter.get("/dashboard", okrController.getDashboard);

okrRouter.post(
    "/objectives",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD", "EMPLOYEE"),
    validate(createObjectiveSchema),
    okrController.createObjective,
);

okrRouter.patch(
    "/objectives/:objectiveId/status",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    validate(updateOkrStatusSchema),
    okrController.updateObjectiveStatus,
);

okrRouter.post(
    "/key-results/:keyResultId/check-in",
    validate(checkInKeyResultSchema),
    okrController.checkInKeyResult,
);

export default okrRouter;

import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { validate } from "../../middlewares/validate-middleware";
import { createLeaveSchema, updateLeaveStatusSchema } from "./leave-validation";
import { leaveController } from "./leave-controller";

const leaveRouter = Router();

leaveRouter.use(authenticate);

leaveRouter.post("/", validate(createLeaveSchema), leaveController.create);
leaveRouter.get("/my", leaveController.getMyLeaves);

leaveRouter.get(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    leaveController.getAllLeaves,
);

leaveRouter.patch(
    "/:id/status",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    validate(updateLeaveStatusSchema),
    leaveController.updateStatus,
);

export default leaveRouter;

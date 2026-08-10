import { validate } from "./../../middlewares/validate-middleware";
import { authenticate, authorize } from "./../../middlewares/auth-middleware";
import { Router } from "express";
import { payrollController } from "./payroll-controller";
import {
    createPayrollSchema,
    updatePayrollStatusSchema,
} from "./payroll-validation";

const payrollRouter = Router();

payrollRouter.use(authenticate);

payrollRouter.get("/my", payrollController.getMyPayrolls);

payrollRouter.post(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(createPayrollSchema),
    payrollController.create,
);

payrollRouter.get(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    payrollController.getAllPayrolls,
);

payrollRouter.patch(
    "/:id/status",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(updatePayrollStatusSchema),
    payrollController.updateStatus,
);

export default payrollRouter;

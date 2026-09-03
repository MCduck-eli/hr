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
    "/calculate-auto",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    payrollController.calculateAuto,
);

payrollRouter.post(
    "/generate-batch",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    payrollController.generateBatch,
);

payrollRouter.post(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    validate(createPayrollSchema),
    payrollController.create,
);

payrollRouter.get(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    payrollController.getAllPayrolls,
);

payrollRouter.patch(
    "/:id/status",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    validate(updatePayrollStatusSchema),
    payrollController.updateStatus,
);

payrollRouter.delete(
    "/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    payrollController.deletePayroll,
);

export default payrollRouter;

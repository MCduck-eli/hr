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

payrollRouter.get(
    "/schedule",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.getSchedule,
);

payrollRouter.put(
    "/schedule",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.updateSchedule,
);

payrollRouter.get(
    "/due-reminders",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.checkDueReminders,
);

payrollRouter.get(
    "/advances",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.getAdvances,
);

payrollRouter.get(
    "/advances/my",
    payrollController.getMyAdvances,
);

payrollRouter.post(
    "/advances",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.createAdvance,
);

payrollRouter.patch(
    "/advances/:id/status",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.updateAdvanceStatus,
);

payrollRouter.post(
    "/advances/confirm-receipt/:id",
    payrollController.confirmAdvanceReceipt,
);

payrollRouter.delete(
    "/advances/:id",
    authorize("SUPER_ADMIN", "DIRECTOR"),
    payrollController.deleteAdvance,
);

payrollRouter.post(
    "/pay/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.paySalary,
);

payrollRouter.post(
    "/confirm-receipt/:id",
    payrollController.confirmSalaryReceipt,
);

payrollRouter.get(
    "/payment-records",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.getPaymentRecords,
);

payrollRouter.delete(
    "/payment-records/clear-all",
    authorize("SUPER_ADMIN", "DIRECTOR"),
    payrollController.clearAllPaymentRecords,
);

payrollRouter.delete(
    "/payment-records/:id",
    authorize("SUPER_ADMIN", "DIRECTOR"),
    payrollController.deletePaymentRecord,
);

payrollRouter.get(
    "/penalty-rules",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.getPenaltyRules,
);

payrollRouter.post(
    "/penalty-rules",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.createPenaltyRule,
);

payrollRouter.put(
    "/penalty-rules/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.updatePenaltyRule,
);

payrollRouter.delete(
    "/penalty-rules/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.deletePenaltyRule,
);

payrollRouter.get(
    "/penalties-summary",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.getPenaltiesSummary,
);

payrollRouter.get(
    "/employee-penalties",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.getEmployeePenalties,
);

payrollRouter.post(
    "/employee-penalties",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.createEmployeePenalty,
);

payrollRouter.delete(
    "/employee-penalties/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.deleteEmployeePenalty,
);

payrollRouter.post(
    "/calculate-auto",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.calculateAuto,
);

payrollRouter.post(
    "/generate-batch",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.generateBatch,
);

payrollRouter.post(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    validate(createPayrollSchema),
    payrollController.create,
);

payrollRouter.get(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    payrollController.getAllPayrolls,
);

payrollRouter.patch(
    "/:id/status",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    validate(updatePayrollStatusSchema),
    payrollController.updateStatus,
);

payrollRouter.delete(
    "/:id",
    authorize("SUPER_ADMIN", "DIRECTOR"),
    payrollController.deletePayroll,
);

export default payrollRouter;


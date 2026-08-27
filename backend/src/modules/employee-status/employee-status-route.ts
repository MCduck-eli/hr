import { Router } from "express";
import { employeeStatusController } from "./employee-status-controller";
import { authenticate, authorize } from "../../middlewares/auth-middleware";

const employeeStatusRouter = Router();

employeeStatusRouter.use(authenticate);

employeeStatusRouter.get("/", employeeStatusController.getAllStatuses);

employeeStatusRouter.post(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    employeeStatusController.createStatus,
);

employeeStatusRouter.put(
    "/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    employeeStatusController.updateStatus,
);

employeeStatusRouter.delete(
    "/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    employeeStatusController.deleteStatus,
);

export default employeeStatusRouter;

import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { departmentController } from "./department-controller";
import { validate } from "../../middlewares/validate-middleware";
import { createDepartmentSchema } from "./department-validation";

const departmentRouter = Router();

departmentRouter.use(authenticate);

departmentRouter.get("/", departmentController.getAll);
departmentRouter.get("/:id", departmentController.getOne);

departmentRouter.post(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    validate(createDepartmentSchema),
    departmentController.create,
);

departmentRouter.post(
    "/:id/assign-employee",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    departmentController.assignEmployee,
);

departmentRouter.patch(
    "/:id/assign-employee",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    departmentController.assignEmployee,
);

departmentRouter.post(
    "/:id/unassign-employee",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    departmentController.unassignEmployee,
);

departmentRouter.patch(
    "/:id/unassign-employee",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    departmentController.unassignEmployee,
);

departmentRouter.delete(
    "/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    departmentController.delete,
);

export default departmentRouter;


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
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(createDepartmentSchema),
    departmentController.create,
);

departmentRouter.delete(
    "/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    departmentController.delete,
);

export default departmentRouter;

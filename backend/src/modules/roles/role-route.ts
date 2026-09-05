import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { roleController } from "./role-controller";

const roleRouter = Router();

roleRouter.use(authenticate);

roleRouter.get(
    "/",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN", "MANAGER", "DEPARTMENT_HEAD", "RECRUITER", "EMPLOYEE"),
    roleController.getAll,
);

roleRouter.post(
    "/",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    roleController.create,
);

roleRouter.put(
    "/:id",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    roleController.update,
);

roleRouter.delete(
    "/:id",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    roleController.delete,
);

export default roleRouter;

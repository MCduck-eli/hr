import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { roleController } from "./role-controller";

const roleRouter = Router();

roleRouter.use(authenticate);

roleRouter.get(
    "/",
    authorize(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_ADMIN, Role.DEPARTMENT_HEAD, Role.RECRUITER, Role.EMPLOYEE),
    roleController.getAll,
);

roleRouter.post(
    "/",
    authorize(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_ADMIN),
    roleController.create,
);

roleRouter.put(
    "/:id",
    authorize(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_ADMIN),
    roleController.update,
);

roleRouter.delete(
    "/:id",
    authorize(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_ADMIN),
    roleController.delete,
);

export default roleRouter;

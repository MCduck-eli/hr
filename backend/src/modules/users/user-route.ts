import { authenticate, authorize } from "./../../middlewares/auth-middleware";
import { Router } from "express";
import { userController } from "./user-controller";
import { updateUserSchema } from "./user-validation";
import { validate } from "../../middlewares/validate-middleware";

const userRouter = Router();

userRouter.use(authenticate);

userRouter.get(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    userController.getAll,
);
userRouter.get("/:id", userController.getOne);
userRouter.patch(
    "/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(updateUserSchema),
    userController.update,
);

export default userRouter;

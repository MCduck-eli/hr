import { loginSchema, registerSchema } from "./auth-validation";
import { authController } from "./auth-controller";
import { Router } from "express";
import { validate } from "../../middlewares/validate-middleware";

const authRouter = Router();

authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/register", validate(registerSchema), authController.register);

export default authRouter;

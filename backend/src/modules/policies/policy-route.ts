import { validate } from "./../../middlewares/validate-middleware";
import { authenticate, authorize } from "./../../middlewares/auth-middleware";
import { Router } from "express";
import { policyController } from "./policy-controller";
import { createPolicySchema } from "./policy-validation";

const policyRouter = Router();

policyRouter.use(authenticate);

policyRouter.get("/", policyController.getAll);
policyRouter.post("/:policyId/sign", policyController.sign);

policyRouter.post(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(createPolicySchema),
    policyController.create,
);

export default policyRouter;

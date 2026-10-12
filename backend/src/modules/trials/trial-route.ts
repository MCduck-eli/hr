import { Router } from "express";
import { trialController } from "./trial-controller";
import { authenticate, authorize } from "../../middlewares/auth-middleware";

const trialRouter = Router();

trialRouter.post("/", trialController.create);
trialRouter.get("/", authenticate, authorize("SUPER_ADMIN"), trialController.getAll);
trialRouter.post("/:id/approve", authenticate, authorize("SUPER_ADMIN"), trialController.approve);
trialRouter.post("/:id/reject", authenticate, authorize("SUPER_ADMIN"), trialController.reject);

export default trialRouter;

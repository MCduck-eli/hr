import { Router } from "express";
import { trialController } from "./trial-controller";
import { authenticate, authorize } from "../../middlewares/auth-middleware";

const trialRouter = Router();

trialRouter.post("/", trialController.create);
trialRouter.get("/", authenticate, authorize("SUPER_ADMIN"), trialController.getAll);
trialRouter.post("/:id/approve", authenticate, authorize("SUPER_ADMIN"), trialController.approve);
trialRouter.post("/:id/reject", authenticate, authorize("SUPER_ADMIN"), trialController.reject);
trialRouter.patch("/:id/extend", authenticate, authorize("SUPER_ADMIN"), trialController.extend);
trialRouter.post("/:id/extend", authenticate, authorize("SUPER_ADMIN"), trialController.extend);

export default trialRouter;

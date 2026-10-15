import { Router } from "express";
import { backupController } from "./backup-controller";
import { authenticate, authorize } from "../../middlewares/auth-middleware";

const backupRouter = Router();

backupRouter.post("/", authenticate, authorize("SUPER_ADMIN"), backupController.create);
backupRouter.get("/", authenticate, authorize("SUPER_ADMIN"), backupController.getAll);
backupRouter.get("/:fileName/download", authenticate, authorize("SUPER_ADMIN"), backupController.getDownloadUrl);

export default backupRouter;

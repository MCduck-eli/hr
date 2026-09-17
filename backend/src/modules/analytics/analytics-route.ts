import { Router } from "express";
import { analyticsController } from "./analytics-controller";
import { authenticate, authorize } from "../../middlewares/auth-middleware";

const analyticsRouter = Router();

analyticsRouter.use(authenticate);

analyticsRouter.get(
    "/executive-summary",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    analyticsController.getExecutiveSummary,
);

analyticsRouter.get(
    "/nine-box-grid",
    authorize("SUPER_ADMIN", "DIRECTOR", "HR_ADMIN"),
    analyticsController.getNineBoxGrid,
);

export default analyticsRouter;

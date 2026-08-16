import { Router } from "express";
import { dashboardController } from "./dashboard-controller";
import { authenticate } from "../../middlewares/auth-middleware";
import { validate } from "../../middlewares/validate-middleware";
import { getDashboardSchema } from "./dashboard-validation";

const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get(
    "/dashboard",
    validate(getDashboardSchema),
    dashboardController.getEmployeeDashboard,
);

export default dashboardRouter;

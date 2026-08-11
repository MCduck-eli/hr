import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { validate } from "../../middlewares/validate-middleware";
import { updateHierarchySchema } from "./org-chart.validation";
import { orgChartController } from "./org-chart-controller";

const orgChartRouter = Router();

orgChartRouter.use(authenticate);

orgChartRouter.get("/tree", orgChartController.getOrgTree);
orgChartRouter.get("/my-context", orgChartController.getMyOrgContext);
orgChartRouter.get(
    "/history",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    orgChartController.getOrgHistory,
);
orgChartRouter.patch(
    "/employees/:employeeId/hierarchy",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(updateHierarchySchema),
    orgChartController.updateEmployeeHierarchy,
);

export default orgChartRouter;

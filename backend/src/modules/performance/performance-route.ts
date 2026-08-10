import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { performanceController } from "./performance-controller";
import { validate } from "../../middlewares/validate-middleware";
import { createPerformanceReviewSchema } from "./performance-validation";

const performanceRouter = Router();

performanceRouter.use(authenticate);

performanceRouter.get("/my", performanceController.getMyReviews);

performanceRouter.post(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    validate(createPerformanceReviewSchema),
    performanceController.create,
);

performanceRouter.get(
    "/employee/:employeeId",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    performanceController.getEmployeeReviews,
);

export default performanceRouter;

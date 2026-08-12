import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { validate } from "../../middlewares/validate-middleware";
import {
    approvePromotionSchema,
    createGradeSchema,
    requestPromotionSchema,
} from "./grading-validation";
import { gradingController } from "./grading-controller";

const gradingRouter = Router();

gradingRouter.use(authenticate);

gradingRouter.get("/grades", gradingController.getGrades);

gradingRouter.post(
    "/grades",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(createGradeSchema),
    gradingController.createGrade,
);

gradingRouter.post(
    "/employee/:employeeId/assign-grade",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    gradingController.assignGradeToEmployee,
);

gradingRouter.post(
    "/promotion-requests",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    validate(requestPromotionSchema),
    gradingController.createPromotionRequest,
);

gradingRouter.patch(
    "/promotion-requests/:requestId/approval",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    validate(approvePromotionSchema),
    gradingController.processPromotionApproval,
);

gradingRouter.get(
    "/career-history/:employeeId",
    gradingController.getCareerHistory,
);

export default gradingRouter;

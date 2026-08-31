import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { validate } from "../../middlewares/validate-middleware";
import {
    approvePromotionSchema,
    createGradeSchema,
    updateGradeSchema,
    requestPromotionSchema,
} from "./grading-validation";
import { gradingController } from "./grading-controller";

const gradingRouter = Router();

gradingRouter.use(authenticate);

gradingRouter.get("/grades", gradingController.getGrades);

gradingRouter.post(
    "/grades",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    validate(createGradeSchema),
    gradingController.createGrade,
);

gradingRouter.put(
    "/grades/:gradeId",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    validate(updateGradeSchema),
    gradingController.updateGrade,
);

gradingRouter.delete(
    "/grades/:gradeId",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    gradingController.deleteGrade,
);

gradingRouter.get("/employees", gradingController.getEmployeesWithGrades);

gradingRouter.get("/promotion-requests", gradingController.getPromotionRequests);

gradingRouter.post(
    "/employee/:employeeId/assign-grade",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    gradingController.assignGradeToEmployee,
);

gradingRouter.post(
    "/promotion-requests",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"),
    validate(requestPromotionSchema),
    gradingController.createPromotionRequest,
);

gradingRouter.patch(
    "/promotion-requests/:requestId/approval",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"),
    validate(approvePromotionSchema),
    gradingController.processPromotionApproval,
);

gradingRouter.get(
    "/career-history/:employeeId",
    gradingController.getCareerHistory,
);

export default gradingRouter;

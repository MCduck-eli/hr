import { validate } from "./../../middlewares/validate-middleware";
import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { discController } from "./disc-controller";
import {
    createQuestionSchema,
    submitAssessmentSchema,
} from "./disc-validation";

const discRouter = Router();

discRouter.use(authenticate);

discRouter.get("/questions", discController.getQuestions);

discRouter.post(
    "/questions",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    validate(createQuestionSchema),
    discController.createQuestion,
);

discRouter.put(
    "/questions/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    discController.updateQuestion,
);

discRouter.delete(
    "/questions/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    discController.deleteQuestion,
);

discRouter.post(
    "/submit",
    validate(submitAssessmentSchema),
    discController.submitAssessment,
);

discRouter.get("/my-profile", discController.getMyDiscProfile);

discRouter.get(
    "/team-analytics",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"),
    discController.getTeamDiscAnalytics,
);

export default discRouter;

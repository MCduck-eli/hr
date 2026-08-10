import { authenticate, authorize } from "./../../middlewares/auth-middleware";
import { validate } from "./../../middlewares/validate-middleware";
import { Router } from "express";
import {
    addFeedbackSchema,
    applyCandidateSchema,
    createVacancySchema,
    updateStageSchema,
} from "./recruitment-validation";
import { recruitmentController } from "./recruitment-controller";

const recruitmentRouter = Router();

recruitmentRouter.post(
    "/apply",
    validate(applyCandidateSchema),
    recruitmentController.applyCandidate,
);

recruitmentRouter.use(authenticate);

recruitmentRouter.get(
    "/vacancies",
    authorize("SUPER_ADMIN", "HR_ADMIN", "RECRUITER"),
    recruitmentController.getAllVacancies,
);

recruitmentRouter.post(
    "/vacancies",
    authorize("SUPER_ADMIN", "HR_ADMIN", "RECRUITER"),
    validate(createVacancySchema),
    recruitmentController.createVacancy,
);

recruitmentRouter.get(
    "/candidates/:candidateId",
    authorize("SUPER_ADMIN", "HR_ADMIN", "RECRUITER"),
    recruitmentController.getCandidateDetails,
);

recruitmentRouter.patch(
    "/candidates/:candidateId/stage",
    authorize("SUPER_ADMIN", "HR_ADMIN", "RECRUITER"),
    validate(updateStageSchema),
    recruitmentController.updateStage,
);

recruitmentRouter.post(
    "/candidates/:candidateId/feedback",
    authorize("SUPER_ADMIN", "HR_ADMIN", "RECRUITER", "DEPARTMENT_HEAD"),
    validate(addFeedbackSchema),
    recruitmentController.addFeedback,
);

export default recruitmentRouter;

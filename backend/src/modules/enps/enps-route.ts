import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { enpsController } from "./enps-controller";

const enpsRouter = Router();

enpsRouter.use(authenticate);

enpsRouter.get("/questions", enpsController.getQuestions);
enpsRouter.post(
    "/questions",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "CEO"),
    enpsController.createQuestion
);
enpsRouter.put(
    "/questions/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "CEO"),
    enpsController.updateQuestion
);
enpsRouter.delete(
    "/questions/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "CEO"),
    enpsController.deleteQuestion
);

enpsRouter.post("/submit", enpsController.submitEnps);
enpsRouter.get("/my-latest", enpsController.getMyLatestEnps);
enpsRouter.get(
    "/analytics",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "CEO"),
    enpsController.getEnpsAnalytics
);

export default enpsRouter;

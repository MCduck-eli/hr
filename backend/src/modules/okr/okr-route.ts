import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { validate } from "../../middlewares/validate-middleware";
import { okrController } from "./okr-controller";
import {
    checkInKeyResultSchema,
    createCycleSchema,
    createObjectiveSchema,
    updateOkrStatusSchema,
    updateObjectiveSchema
} from "./okr-validation";
import multer from "multer";
import fs from "fs";

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    },
});

const upload = multer({ storage });

const okrRouter = Router();

okrRouter.use(authenticate);

okrRouter.get("/cycles", okrController.getCycles);
okrRouter.post(
    "/cycles",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(createCycleSchema),
    okrController.createCycle,
);

okrRouter.get("/dashboard", okrController.getDashboard);

okrRouter.post(
    "/objectives",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD", "EMPLOYEE"),
    validate(createObjectiveSchema),
    okrController.createObjective,
);

okrRouter.put(
    "/objectives/:objectiveId",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    validate(updateObjectiveSchema),
    okrController.updateObjective,
);

okrRouter.delete(
    "/objectives/:objectiveId",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    okrController.deleteObjective,
);

okrRouter.patch(
    "/objectives/:objectiveId/status",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    validate(updateOkrStatusSchema),
    okrController.updateObjectiveStatus,
);

okrRouter.post(
    "/key-results/:keyResultId/check-in",
    upload.fields([{ name: "proofImage", maxCount: 1 }]),
    validate(checkInKeyResultSchema),
    okrController.checkInKeyResult,
);

okrRouter.get(
    "/check-ins/pending",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    okrController.getPendingCheckIns,
);

okrRouter.patch(
    "/check-ins/:checkInId/review",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    okrController.reviewCheckIn,
);

export default okrRouter;

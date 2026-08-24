import { authenticate, authorize } from "./../../middlewares/auth-middleware";
import { validate } from "./../../middlewares/validate-middleware";
import { Router } from "express";
import {
    addFeedbackSchema,
    applyCandidateSchema,
    createVacancySchema,
    updateVacancySchema,
    updateStageSchema,
    sendCandidateEmailSchema,
} from "./recruitment-validation";
import { recruitmentController } from "./recruitment-controller";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/resumes/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

const taskUploadDir = "uploads/tasks/";
if (!fs.existsSync(taskUploadDir)) {
    fs.mkdirSync(taskUploadDir, { recursive: true });
}

const taskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, taskUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "task-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const uploadTask = multer({ storage: taskStorage });

const recruitmentRouter = Router();

recruitmentRouter.post(
    "/apply",
    upload.single("resume"),
    validate(applyCandidateSchema),
    recruitmentController.applyCandidate,
);

recruitmentRouter.get(
    "/public/vacancies/:id",
    recruitmentController.getPublicVacancy,
);

recruitmentRouter.get(
    "/public/candidates/:candidateId/task",
    recruitmentController.getPublicCandidateTask,
);

recruitmentRouter.post(
    "/public/candidates/:candidateId/submit-task",
    uploadTask.single("file"),
    recruitmentController.submitPublicCandidateTask,
);

recruitmentRouter.get(
    "/geocode",
    recruitmentController.reverseGeocode,
);

recruitmentRouter.get(
    "/search-location",
    recruitmentController.searchLocation,
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

recruitmentRouter.put(
    "/vacancies/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "RECRUITER"),
    validate(updateVacancySchema),
    recruitmentController.updateVacancy,
);

recruitmentRouter.delete(
    "/vacancies/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "RECRUITER"),
    recruitmentController.deleteVacancy,
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

recruitmentRouter.post(
    "/candidates/:candidateId/hire",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    recruitmentController.hireCandidate,
);

recruitmentRouter.post(
    "/candidates/:candidateId/email",
    authorize("SUPER_ADMIN", "HR_ADMIN", "RECRUITER"),
    validate(sendCandidateEmailSchema),
    recruitmentController.sendEmail,
);

recruitmentRouter.post(
    "/upload-task",
    authorize("SUPER_ADMIN", "HR_ADMIN", "RECRUITER"),
    uploadTask.single("file"),
    recruitmentController.uploadTaskFile,
);

export default recruitmentRouter;

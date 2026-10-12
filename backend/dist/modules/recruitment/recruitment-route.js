"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_middleware_1 = require("./../../middlewares/auth-middleware");
const validate_middleware_1 = require("./../../middlewares/validate-middleware");
const express_1 = require("express");
const recruitment_validation_1 = require("./recruitment-validation");
const recruitment_controller_1 = require("./recruitment-controller");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = "uploads/resumes/";
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({ storage });
const taskUploadDir = "uploads/tasks/";
if (!fs_1.default.existsSync(taskUploadDir)) {
    fs_1.default.mkdirSync(taskUploadDir, { recursive: true });
}
const taskStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, taskUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "task-" + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const uploadTask = (0, multer_1.default)({ storage: taskStorage });
const memoryUpload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const recruitmentRouter = (0, express_1.Router)();
recruitmentRouter.post("/apply", upload.single("resume"), (0, validate_middleware_1.validate)(recruitment_validation_1.applyCandidateSchema), recruitment_controller_1.recruitmentController.applyCandidate);
recruitmentRouter.get("/public/vacancies", recruitment_controller_1.recruitmentController.getPublicVacancies);
recruitmentRouter.get("/public/vacancies/:id", recruitment_controller_1.recruitmentController.getPublicVacancy);
recruitmentRouter.get("/public/candidates/:candidateId/task", recruitment_controller_1.recruitmentController.getPublicCandidateTask);
recruitmentRouter.post("/public/candidates/:candidateId/submit-task", uploadTask.single("file"), recruitment_controller_1.recruitmentController.submitPublicCandidateTask);
recruitmentRouter.post("/parse-cv", memoryUpload.single("file"), recruitment_controller_1.recruitmentController.parseResume);
recruitmentRouter.get("/geocode", recruitment_controller_1.recruitmentController.reverseGeocode);
recruitmentRouter.get("/search-location", recruitment_controller_1.recruitmentController.searchLocation);
recruitmentRouter.use(auth_middleware_1.authenticate);
recruitmentRouter.get("/vacancies", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "RECRUITER", "DEPARTMENT_HEAD", "EMPLOYEE", "ACCOUNTANT"), recruitment_controller_1.recruitmentController.getAllVacancies);
recruitmentRouter.post("/vacancies", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "RECRUITER", "DEPARTMENT_HEAD"), (0, validate_middleware_1.validate)(recruitment_validation_1.createVacancySchema), recruitment_controller_1.recruitmentController.createVacancy);
recruitmentRouter.put("/vacancies/:id", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "RECRUITER", "DEPARTMENT_HEAD"), (0, validate_middleware_1.validate)(recruitment_validation_1.updateVacancySchema), recruitment_controller_1.recruitmentController.updateVacancy);
recruitmentRouter.delete("/vacancies/:id", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "RECRUITER", "DEPARTMENT_HEAD"), recruitment_controller_1.recruitmentController.deleteVacancy);
recruitmentRouter.get("/candidates/:candidateId", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "RECRUITER"), recruitment_controller_1.recruitmentController.getCandidateDetails);
recruitmentRouter.patch("/candidates/:candidateId/stage", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "RECRUITER"), (0, validate_middleware_1.validate)(recruitment_validation_1.updateStageSchema), recruitment_controller_1.recruitmentController.updateStage);
recruitmentRouter.post("/candidates/:candidateId/feedback", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "RECRUITER", "DEPARTMENT_HEAD"), (0, validate_middleware_1.validate)(recruitment_validation_1.addFeedbackSchema), recruitment_controller_1.recruitmentController.addFeedback);
recruitmentRouter.post("/candidates/:candidateId/hire", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"), recruitment_controller_1.recruitmentController.hireCandidate);
recruitmentRouter.post("/candidates/:candidateId/email", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "RECRUITER"), (0, validate_middleware_1.validate)(recruitment_validation_1.sendCandidateEmailSchema), recruitment_controller_1.recruitmentController.sendEmail);
recruitmentRouter.post("/candidates/:candidateId/sms", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "RECRUITER"), recruitment_controller_1.recruitmentController.sendSms);
recruitmentRouter.post("/upload-task", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "RECRUITER"), uploadTask.single("file"), recruitment_controller_1.recruitmentController.uploadTaskFile);
exports.default = recruitmentRouter;

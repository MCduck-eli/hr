"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth-middleware");
const validate_middleware_1 = require("../../middlewares/validate-middleware");
const okr_controller_1 = require("./okr-controller");
const okr_validation_1 = require("./okr-validation");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = "uploads/";
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    },
});
const upload = (0, multer_1.default)({ storage });
const okrRouter = (0, express_1.Router)();
okrRouter.use(auth_middleware_1.authenticate);
okrRouter.get("/cycles", okr_controller_1.okrController.getCycles);
okrRouter.post("/cycles", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), (0, validate_middleware_1.validate)(okr_validation_1.createCycleSchema), okr_controller_1.okrController.createCycle);
okrRouter.get("/dashboard", okr_controller_1.okrController.getDashboard);
okrRouter.post("/objectives", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD", "EMPLOYEE"), (0, validate_middleware_1.validate)(okr_validation_1.createObjectiveSchema), okr_controller_1.okrController.createObjective);
okrRouter.put("/objectives/:objectiveId", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"), (0, validate_middleware_1.validate)(okr_validation_1.updateObjectiveSchema), okr_controller_1.okrController.updateObjective);
okrRouter.delete("/objectives/:objectiveId", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"), okr_controller_1.okrController.deleteObjective);
okrRouter.patch("/objectives/:objectiveId/status", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"), (0, validate_middleware_1.validate)(okr_validation_1.updateOkrStatusSchema), okr_controller_1.okrController.updateObjectiveStatus);
okrRouter.post("/key-results/:keyResultId/check-in", upload.fields([{ name: "proofImage", maxCount: 1 }]), (0, validate_middleware_1.validate)(okr_validation_1.checkInKeyResultSchema), okr_controller_1.okrController.checkInKeyResult);
okrRouter.get("/check-ins/pending", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"), okr_controller_1.okrController.getPendingCheckIns);
okrRouter.patch("/check-ins/:checkInId/review", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"), okr_controller_1.okrController.reviewCheckIn);
exports.default = okrRouter;

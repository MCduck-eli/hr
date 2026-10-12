"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_middleware_1 = require("./../../middlewares/auth-middleware");
const policy_controller_1 = require("./policy-controller");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), "uploads");
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
});
const policyRouter = (0, express_1.Router)();
policyRouter.use(auth_middleware_1.authenticate);
policyRouter.get("/", policy_controller_1.policyController.getAll);
policyRouter.get("/:policyId", policy_controller_1.policyController.getById);
policyRouter.post("/:policyId/sign", policy_controller_1.policyController.sign);
policyRouter.post("/", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), upload.single("file"), policy_controller_1.policyController.create);
policyRouter.patch("/:policyId", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), upload.single("file"), policy_controller_1.policyController.update);
policyRouter.delete("/:policyId", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), policy_controller_1.policyController.delete);
exports.default = policyRouter;

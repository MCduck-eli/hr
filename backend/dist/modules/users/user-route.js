"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_middleware_1 = require("./../../middlewares/auth-middleware");
const express_1 = require("express");
const user_controller_1 = require("./user-controller");
const user_validation_1 = require("./user-validation");
const validate_middleware_1 = require("../../middlewares/validate-middleware");
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
const userRouter = (0, express_1.Router)();
userRouter.use(auth_middleware_1.authenticate);
userRouter.get("/", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"), user_controller_1.userController.getAll);
userRouter.post("/", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    { name: "file", maxCount: 1 },
]), user_controller_1.userController.create);
userRouter.get("/:id", user_controller_1.userController.getOne);
userRouter.patch("/:id", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    { name: "file", maxCount: 1 },
]), (0, validate_middleware_1.validate)(user_validation_1.updateUserSchema), user_controller_1.userController.update);
userRouter.delete("/:id", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "HR_ADMIN"), user_controller_1.userController.delete);
exports.default = userRouter;

import { authenticate, authorize } from "./../../middlewares/auth-middleware";
import { Router } from "express";
import { userController } from "./user-controller";
import { updateUserSchema } from "./user-validation";
import { validate } from "../../middlewares/validate-middleware";
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

const userRouter = Router();

userRouter.use(authenticate);

userRouter.get(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "ACCOUNTANT"),
    userController.getAll,
);

userRouter.post(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "image", maxCount: 1 },
        { name: "photo", maxCount: 1 },
        { name: "file", maxCount: 1 },
    ]),
    userController.create,
);

userRouter.get("/:id", userController.getOne);

userRouter.patch(
    "/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "image", maxCount: 1 },
        { name: "photo", maxCount: 1 },
        { name: "file", maxCount: 1 },
    ]),
    validate(updateUserSchema),
    userController.update,
);

userRouter.delete(
    "/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    userController.delete,
);

export default userRouter;


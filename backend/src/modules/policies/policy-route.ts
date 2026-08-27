import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate, authorize } from "./../../middlewares/auth-middleware";
import { policyController } from "./policy-controller";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
});

const policyRouter = Router();

policyRouter.use(authenticate);

policyRouter.get("/", policyController.getAll);
policyRouter.get("/:policyId", policyController.getById);
policyRouter.post("/:policyId/sign", policyController.sign);

policyRouter.post(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    upload.single("file"),
    policyController.create,
);

policyRouter.patch(
    "/:policyId",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    upload.single("file"),
    policyController.update,
);

policyRouter.delete(
    "/:policyId",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    policyController.delete,
);

export default policyRouter;

import {
    addLessonSchema,
    addResourceSchema,
    assignAcademySchema,
    createCategorySchema,
    createEventSchema,
    submitQuizSchema,
} from "./academy-validation";
import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { academyController } from "./academy-controller";
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

const academyRouter = Router();

academyRouter.use(authenticate);

academyRouter.get("/categories", academyController.getAllCategories);
academyRouter.get("/courses", academyController.getAllCourses);
academyRouter.get("/courses/:courseId", academyController.getCourseDetails);
academyRouter.post(
    "/courses/:courseId/submit-quiz",
    validate(submitQuizSchema),
    academyController.submitQuiz,
);
academyRouter.get("/events", academyController.getEvents);
academyRouter.post(
    "/events/:eventId/register",
    academyController.registerEvent,
);
academyRouter.get("/certificates/my", academyController.getMyCertificates);

academyRouter.get(
    "/assigned-employees",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    academyController.getAssignedEmployees,
);

academyRouter.post(
    "/categories",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(createCategorySchema),
    academyController.createCategory,
);

academyRouter.post(
    "/courses",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    upload.fields([
        { name: "cover", maxCount: 1 },
        { name: "video", maxCount: 1 },
    ]),
    academyController.createCourse,
);

academyRouter.delete(
    "/courses/:courseId",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    academyController.deleteCourse,
);

academyRouter.post(
    "/courses/:courseId/lessons",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(addLessonSchema),
    academyController.addLesson,
);

academyRouter.post(
    "/courses/:courseId/resources",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(addResourceSchema),
    academyController.addResource,
);

academyRouter.post(
    "/courses/:courseId/quizzes",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    academyController.addQuiz,
);

academyRouter.post(
    "/events",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(createEventSchema),
    academyController.createEvent,
);

academyRouter.patch(
    "/courses/:courseId",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    upload.fields([
        { name: "cover", maxCount: 1 },
        { name: "video", maxCount: 1 },
    ]),
    academyController.updateCourse,
);
academyRouter.post(
    "/assign",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(assignAcademySchema),
    academyController.assignAcademy,
);

export default academyRouter;

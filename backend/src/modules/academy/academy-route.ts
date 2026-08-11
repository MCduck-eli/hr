import { GetEvents } from "./../../generated/prisma/internal/prismaNamespace";
import {
    addLessonSchema,
    addResourceSchema,
    createCategorySchema,
    createCourseSchema,
    createEventSchema,
    submitQuizSchema,
} from "./academy-validation";
import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { academyController } from "./academy-controller";
import { validate } from "../../middlewares/validate-middleware";

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

academyRouter.post(
    "/categories",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(createCategorySchema),
    academyController.createCategory,
);

academyRouter.post(
    "/courses",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(createCourseSchema),
    academyController.createCourse,
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

export default academyRouter;

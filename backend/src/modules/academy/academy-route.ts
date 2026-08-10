import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { academyController } from "./academy-controller";
import {
    addLessonSchema,
    createCourseSchema,
    submitQuizSchema,
} from "./academy-validation";
import { validate } from "../../middlewares/validate-middleware";

const academyRouter = Router();

academyRouter.use(authenticate);

academyRouter.get("/courses", academyController.getAllCourses);
academyRouter.get("/courses/:courseId", academyController.getCourseDetails);
academyRouter.post(
    "/courses/:courseId/submit-quiz",
    validate(submitQuizSchema),
    academyController.submitQuiz,
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
    "/courses/:courseId/quizzes",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    academyController.addQuiz,
);

export default academyRouter;

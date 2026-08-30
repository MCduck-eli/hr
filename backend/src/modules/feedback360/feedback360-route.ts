import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { validate } from "../../middlewares/validate-middleware";

import { feedback360Controller } from "./feedback360-controller";
import {
    assignReviewersSchema,
    createCycleSchema,
    submitFeedbackSchema,
    getAssignmentsSchema,
} from "./feedback360-validation";

const feedback360Router = Router();

feedback360Router.use(authenticate);

feedback360Router.get(
    "/cycles",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR", "EMPLOYEE", "CEO"),
    feedback360Controller.getCycles,
);

feedback360Router.put(
    "/cycles/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    validate(createCycleSchema),
    feedback360Controller.updateCycle,
);

feedback360Router.delete(
    "/cycles/:id",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    feedback360Controller.deleteCycle,
);

feedback360Router.post(
    "/cycles",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    validate(createCycleSchema),
    feedback360Controller.createCycle,
);

feedback360Router.get(
    "/assignments",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    validate(getAssignmentsSchema),
    feedback360Controller.getAssignments,
);

feedback360Router.post(
    "/assign",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DIRECTOR"),
    validate(assignReviewersSchema),
    feedback360Controller.assignReviewers,
);

feedback360Router.get(
    "/my-pending-tasks",
    feedback360Controller.getMyPendingTasks,
);

feedback360Router.get(
    "/assignments/:assignmentId",
    feedback360Controller.getAssignmentById,
);

feedback360Router.delete(
    "/assignments/:assignmentId",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    feedback360Controller.deleteAssignment,
);

feedback360Router.post(
    "/assignments/:assignmentId/submit",
    validate(submitFeedbackSchema),
    feedback360Controller.submitFeedback,
);

feedback360Router.get(
    "/report/:employeeId",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD", "EMPLOYEE"),
    feedback360Controller.getTargetReport,
);

export default feedback360Router;

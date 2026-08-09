import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { validate } from "../../middlewares/validate-middleware";
import { attendanceController } from "./attendance-controller";
import {
    checkInSchema,
    checkOutSchema,
    getAttendanceQuerySchema,
} from "./attendance-validation";

const attendanceRouter = Router();

attendanceRouter.use(authenticate);

attendanceRouter.post(
    "/check-in",
    validate(checkInSchema),
    attendanceController.checkIn,
);
attendanceRouter.post(
    "/check-out",
    validate(checkOutSchema),
    attendanceController.checkOut,
);
attendanceRouter.get(
    "/my",
    validate(getAttendanceQuerySchema),
    attendanceController.getMyAttendance,
);

attendanceRouter.get(
    "/",
    authorize("SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD"),
    validate(getAttendanceQuerySchema),
    attendanceController.getAllAttendance,
);

export default attendanceRouter;

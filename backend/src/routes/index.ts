import { Router } from "express";
import authRouter from "../modules/auth/auth-route";
import departmentRouter from "../modules/departments/department-route";
import userRouter from "../modules/users/user-route";
import attendanceRouter from "../modules/attendance/attendance-route";
import leaveRouter from "../modules/leaves/leave-route";

const mainRouter = Router();

mainRouter.use("/v1/auth", authRouter);
mainRouter.use("/v1/departments", departmentRouter);
mainRouter.use("/v1/users", userRouter);
mainRouter.use("/v1/attendance", attendanceRouter);
mainRouter.use("/v1/leaves", leaveRouter);

export default mainRouter;

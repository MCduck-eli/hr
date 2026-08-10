import { Router } from "express";
import authRouter from "../modules/auth/auth-route";
import departmentRouter from "../modules/departments/department-route";
import userRouter from "../modules/users/user-route";
import attendanceRouter from "../modules/attendance/attendance-route";
import leaveRouter from "../modules/leaves/leave-route";
import payrollRouter from "../modules/payroll/payroll-route";
import performanceRouter from "../modules/performance/performance-route";
import deviceRouter from "../modules/devices/device-route";
import geofenceRouter from "../modules/geofence/geofence-route";
import recruitmentRouter from "../modules/recruitment/recruitment-route";
import onboardingRouter from "../modules/onboarding/onboarding-route";
import policyRouter from "../modules/policies/policy-route";
import academyRouter from "../modules/academy/academy-route";

const mainRouter = Router();

mainRouter.use("/v1/auth", authRouter);
mainRouter.use("/v1/departments", departmentRouter);
mainRouter.use("/v1/users", userRouter);
mainRouter.use("/v1/attendance", attendanceRouter);
mainRouter.use("/v1/leaves", leaveRouter);
mainRouter.use("/v1/payroll", payrollRouter);
mainRouter.use("/v1/performance", performanceRouter);
mainRouter.use("/v1/devices", deviceRouter);
mainRouter.use("/v1/geofences", geofenceRouter);
mainRouter.use("/v1/recruitment", recruitmentRouter);
mainRouter.use("/v1/onboarding", onboardingRouter);
mainRouter.use("/v1/policies", policyRouter);
mainRouter.use("/v1/academy", academyRouter);

export default mainRouter;

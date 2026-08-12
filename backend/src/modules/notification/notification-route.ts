import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth-middleware";
import { validate } from "../../middlewares/validate-middleware";
import { notificationController } from "./notification-controller";
import {
    registerDeviceTokenSchema,
    sendManualNotificationSchema,
} from "./notification-validation";

const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get(
    "/my-notifications",
    notificationController.getMyNotifications,
);

notificationRouter.post(
    "/register-device",
    validate(registerDeviceTokenSchema),
    notificationController.registerDeviceToken,
);

notificationRouter.patch("/:id/read", notificationController.markAsRead);

notificationRouter.post(
    "/send-manual",
    authorize("SUPER_ADMIN", "HR_ADMIN"),
    validate(sendManualNotificationSchema),
    notificationController.sendManualNotification,
);

export default notificationRouter;

import { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification-service";

export class NotificationController {
    async registerDeviceToken(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await notificationService.registerDeviceToken(
                userId,
                req.body.fcmToken,
                req.body.deviceOs,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getMyNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result =
                await notificationService.getUserNotifications(userId);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const userId = (req as any).user.id;
            const result = await notificationService.markAsRead(
                req.params.id,
                userId,
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async sendManualNotification(
        req: Request,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await notificationService.createAndSendNotification({
                userId: req.body.userId,
                title: req.body.title,
                message: req.body.message,
                type: req.body.type,
                sendEmail: true,
                sendPush: true,
            });
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const notificationController = new NotificationController();

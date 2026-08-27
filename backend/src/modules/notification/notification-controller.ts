import { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification-service";

export class NotificationController {
    async registerDeviceToken(req: Request, res: Response, next: NextFunction) {
        try {
            const loggedInUserId = (req as any).user.id;
            const targetUserId = req.body.userId || loggedInUserId;
            const result = await notificationService.registerDeviceToken(
                targetUserId,
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
            const loggedInUserId = (req as any).user.id;
            const targetUserId = req.query.userId
                ? String(req.query.userId)
                : loggedInUserId;
            const result =
                await notificationService.getUserNotifications(targetUserId);
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
            const loggedInUserId = (req as any).user.id;
            const targetUserId = req.body?.userId || req.query?.userId || loggedInUserId;
            const result = await notificationService.markAsRead(
                req.params.id,
                String(targetUserId),
            );
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async markAllAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const loggedInUserId = (req as any).user.id;
            const targetUserId = req.body?.userId || req.query?.userId || loggedInUserId;
            const result = await notificationService.markAllAsRead(String(targetUserId));
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

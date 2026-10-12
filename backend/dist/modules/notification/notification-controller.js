"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("./notification-service");
class NotificationController {
    async registerDeviceToken(req, res, next) {
        try {
            const loggedInUserId = req.user.id;
            const targetUserId = req.body.userId || loggedInUserId;
            const result = await notification_service_1.notificationService.registerDeviceToken(targetUserId, req.body.fcmToken, req.body.deviceOs);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyNotifications(req, res, next) {
        try {
            const loggedInUserId = req.user.id;
            const result = await notification_service_1.notificationService.getUserNotifications(loggedInUserId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async markAsRead(req, res, next) {
        try {
            const loggedInUserId = req.user.id;
            const result = await notification_service_1.notificationService.markAsRead(req.params.id, loggedInUserId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async markAllAsRead(req, res, next) {
        try {
            const loggedInUserId = req.user.id;
            const result = await notification_service_1.notificationService.markAllAsRead(loggedInUserId);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async sendManualNotification(req, res, next) {
        try {
            const result = await notification_service_1.notificationService.createAndSendNotification({
                userId: req.body.userId,
                title: req.body.title,
                message: req.body.message,
                type: req.body.type,
                sendEmail: true,
                sendPush: true,
            });
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();

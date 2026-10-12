"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceController = exports.AttendanceController = void 0;
const attendance_service_1 = require("./attendance-service");
class AttendanceController {
    async checkIn(req, res, next) {
        try {
            const targetUserId = req.body?.userId || req.user.id;
            const result = await attendance_service_1.attendanceService.checkIn(targetUserId, req.body?.note, req.body?.image);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async checkOut(req, res, next) {
        try {
            const targetUserId = req.body?.userId || req.user.id;
            const result = await attendance_service_1.attendanceService.checkOut(targetUserId, req.body?.note);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getTodayStatus(req, res, next) {
        try {
            const targetUserId = req.query?.userId || req.user.id;
            const result = await attendance_service_1.attendanceService.getTodayStatus(targetUserId);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async submitAbsenceReason(req, res, next) {
        try {
            const rawUserId = req.user.id;
            const result = await attendance_service_1.attendanceService.submitAbsenceReason(rawUserId, req.body);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllWorkSchedules(req, res, next) {
        try {
            const result = await attendance_service_1.attendanceService.getAllWorkSchedules();
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getWorkSchedule(req, res, next) {
        try {
            const result = await attendance_service_1.attendanceService.getWorkSchedule();
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createWorkSchedule(req, res, next) {
        try {
            const result = await attendance_service_1.attendanceService.createWorkSchedule(req.body);
            res.status(201).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateWorkSchedule(req, res, next) {
        try {
            const id = req.params?.id || req.body?.id;
            const result = await attendance_service_1.attendanceService.updateWorkSchedule({
                ...req.body,
                id,
            });
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteWorkSchedule(req, res, next) {
        try {
            const result = await attendance_service_1.attendanceService.deleteWorkSchedule(req.params.id);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyAttendance(req, res, next) {
        try {
            const targetUserId = req.query?.userId || req.user.id;
            const result = await attendance_service_1.attendanceService.getMyAttendance(targetUserId, req.query);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllAttendance(req, res, next) {
        try {
            const result = await attendance_service_1.attendanceService.getAllAttendance(req.query, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AttendanceController = AttendanceController;
exports.attendanceController = new AttendanceController();

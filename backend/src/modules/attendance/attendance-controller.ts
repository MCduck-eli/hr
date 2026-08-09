import { Request, Response, NextFunction } from "express";
import { attendanceService } from "./attendance-service";

export class AttendanceController {
    async checkIn(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await attendanceService.checkIn(
                req.user!.id,
                req.body.note,
            );
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async checkOut(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await attendanceService.checkOut(
                req.user!.id,
                req.body.note,
            );
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getMyAttendance(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await attendanceService.getMyAttendance(
                req.user!.id,
                req.query,
            );
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllAttendance(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await attendanceService.getAllAttendance(req.query);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const attendanceController = new AttendanceController();

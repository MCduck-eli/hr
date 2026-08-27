import { Request, Response, NextFunction } from "express";
import { attendanceService } from "./attendance-service";

export class AttendanceController {
    async checkIn(req: Request, res: Response, next: NextFunction) {
        try {
            const targetUserId = req.body?.userId || req.user!.id;
            const result = await attendanceService.checkIn(
                targetUserId,
                req.body?.note,
                req.body?.image,
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
            const targetUserId = req.body?.userId || req.user!.id;
            const result = await attendanceService.checkOut(
                targetUserId,
                req.body?.note,
            );
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getTodayStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const targetUserId = (req.query?.userId as string) || req.user!.id;
            const result = await attendanceService.getTodayStatus(targetUserId);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async submitAbsenceReason(req: Request, res: Response, next: NextFunction) {
        try {
            const rawUserId = req.user!.id;
            const result = await attendanceService.submitAbsenceReason(
                rawUserId,
                req.body,
            );
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllWorkSchedules(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await attendanceService.getAllWorkSchedules();
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getWorkSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await attendanceService.getWorkSchedule();
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async createWorkSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await attendanceService.createWorkSchedule(req.body);
            res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateWorkSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params?.id || req.body?.id;
            const result = await attendanceService.updateWorkSchedule({
                ...req.body,
                id,
            });
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteWorkSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await attendanceService.deleteWorkSchedule(
                req.params.id,
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
            const targetUserId = (req.query?.userId as string) || req.user!.id;
            const result = await attendanceService.getMyAttendance(
                targetUserId,
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

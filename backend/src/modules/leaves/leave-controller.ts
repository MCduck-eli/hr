import { Request, Response, NextFunction } from "express";
import { LeaveStatus } from "@prisma/client";
import { leaveService } from "./leave-service";

export class LeaveController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await leaveService.createLeaveRequest(
                req.user!.id,
                req.body,
            );
            res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getMyLeaves(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await leaveService.getMyLeaveRequests(req.user!.id);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllLeaves(req: Request, res: Response, next: NextFunction) {
        try {
            const status = req.query.status as LeaveStatus | undefined;
            const result = await leaveService.getAllLeaveRequests(status);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await leaveService.updateLeaveStatus(
                req.params.id,
                req.body.status,
                req.user!.id,
            );
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const leaveController = new LeaveController();

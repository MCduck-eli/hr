import { Request, Response, NextFunction } from "express";
import { userService } from "./user-service";

export class UserController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await userService.getAllUsers(req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getOne(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await userService.getUserById(req.params.id);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await userService.createUser(req.body, req.user);
            res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
    async update(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const body = { ...req.body };
            if (body.departmentId === "") body.departmentId = null;
            if (body.positionId === "") body.positionId = null;

            const result = await userService.updateUser(req.params.id, body, req.user);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            await userService.deleteUser(req.params.id, req.user);
            res.status(200).json({
                status: "success",
                message: "User deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}

export const userController = new UserController();

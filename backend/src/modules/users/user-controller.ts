import { Request, Response, NextFunction } from "express";
import { userService } from "./user-service";

export class UserController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await userService.getAllUsers();
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

    async update(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await userService.updateUser(
                req.params.id,
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
}

export const userController = new UserController();

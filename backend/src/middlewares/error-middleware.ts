import { Request, Response, NextFunction } from "express";

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const statusCode = err.statusCode || 500;
    const status = err.status || "error";

    res.status(statusCode).json({
        status,
        message: err.message || "Internal Server Error",
    });
};

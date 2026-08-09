import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export type Role =
    | "SUPER_ADMIN"
    | "HR_ADMIN"
    | "DEPARTMENT_HEAD"
    | "EMPLOYEE"
    | "RECRUITER"
    | "CANDIDATE";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: Role;
            };
        }
    }
}

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "fail",
            message: "Unauthorized access",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            status: "fail",
            message: "Invalid or expired token",
        });
    }
};

export const authorize = (...roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                status: "fail",
                message: "Permission denied",
            });
        }
        next();
    };
};

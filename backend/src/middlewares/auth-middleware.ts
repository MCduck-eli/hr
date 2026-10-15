import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import prisma from "../config/db";

export type Role =
    | "SUPER_ADMIN"
    | "DIRECTOR"
    | "HR_ADMIN"
    | "DEPARTMENT_HEAD"
    | "ACCOUNTANT"
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
                companyId?: string;
                companyName?: string;
            };
        }
    }
}

export const authenticate = async (
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
        if (decoded) {
            if (!decoded.companyId && decoded.companyName) {
                decoded.companyId = decoded.companyName;
            }
            if (!decoded.companyId && decoded.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: decoded.id },
                    select: { companyName: true },
                });
                if (dbUser?.companyName) {
                    decoded.companyId = dbUser.companyName;
                    decoded.companyName = dbUser.companyName;
                }
            }
        }
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
        if (!req.user) {
            return res.status(403).json({
                status: "fail",
                message: "Permission denied",
            });
        }

        if (
            req.user.role === "SUPER_ADMIN" ||
            req.user.role === "DIRECTOR" ||
            roles.includes(req.user.role)
        ) {
            return next();
        }

        return res.status(403).json({
            status: "fail",
            message: "Permission denied",
        });
    };
};

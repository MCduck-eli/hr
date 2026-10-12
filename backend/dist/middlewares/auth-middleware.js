"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "fail",
            message: "Unauthorized access",
        });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            status: "fail",
            message: "Invalid or expired token",
        });
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({
                status: "fail",
                message: "Permission denied",
            });
        }
        if (req.user.role === "SUPER_ADMIN" ||
            req.user.role === "DIRECTOR" ||
            roles.includes(req.user.role)) {
            return next();
        }
        return res.status(403).json({
            status: "fail",
            message: "Permission denied",
        });
    };
};
exports.authorize = authorize;

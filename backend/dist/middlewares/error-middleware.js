"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const status = err.status || "error";
    res.status(statusCode).json({
        status,
        message: err.message || "Internal Server Error",
    });
};
exports.errorHandler = errorHandler;

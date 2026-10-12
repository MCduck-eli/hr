"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth-service");
class AuthController {
    async login(req, res, next) {
        try {
            const result = await auth_service_1.authService.login(req.body);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async register(req, res, next) {
        try {
            const result = await auth_service_1.authService.register(req.body);
            res.status(201).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async sendOtp(req, res, next) {
        try {
            const result = await auth_service_1.authService.sendOtp(req.body);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyOtp(req, res, next) {
        try {
            const result = await auth_service_1.authService.verifyOtp(req.body);
            res.status(200).json({
                status: "success",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();

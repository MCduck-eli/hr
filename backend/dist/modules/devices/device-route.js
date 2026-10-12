"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const device_controller_1 = require("./device-controller");
const deviceRouter = (0, express_1.Router)();
deviceRouter.post("/webhook/:provider", device_controller_1.deviceController.handleWebhook);
exports.default = deviceRouter;

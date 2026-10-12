"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceController = exports.DeviceController = void 0;
const device_service_1 = require("./device-service");
class DeviceController {
    async handleWebhook(req, res, next) {
        try {
            const result = await device_service_1.deviceService.processDeviceLog(req.params.provider, req.body);
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
exports.DeviceController = DeviceController;
exports.deviceController = new DeviceController();

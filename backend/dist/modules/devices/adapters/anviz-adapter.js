"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnvizAdapter = void 0;
class AnvizAdapter {
    parsePayload(rawPayload) {
        const employeeUserId = String(rawPayload.employee_no ||
            rawPayload.employeeNo ||
            rawPayload.user_id ||
            rawPayload.userId ||
            rawPayload.UserCode ||
            rawPayload.pin ||
            rawPayload.employeeId ||
            rawPayload.id ||
            "");
        const timestampStr = rawPayload.checktime ||
            rawPayload.check_time ||
            rawPayload.dateTime ||
            rawPayload.timestamp ||
            rawPayload.RecordDate ||
            rawPayload.time ||
            Date.now();
        const deviceId = rawPayload.device_id ||
            rawPayload.deviceId ||
            rawPayload.DeviceID ||
            rawPayload.sn ||
            rawPayload.SerialNo ||
            rawPayload.devName;
        return {
            employeeUserId,
            timestamp: new Date(timestampStr),
            deviceType: "ANVIZ",
            deviceId: deviceId ? String(deviceId) : undefined,
        };
    }
}
exports.AnvizAdapter = AnvizAdapter;

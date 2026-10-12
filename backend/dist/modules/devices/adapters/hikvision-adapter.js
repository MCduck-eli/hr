"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HikvisionAdapter = void 0;
class HikvisionAdapter {
    parsePayload(rawPayload) {
        const event = rawPayload.AccessControllerEvent || rawPayload.Event || rawPayload;
        const employeeUserId = String(event.employeeNo ||
            event.employeeNoString ||
            event.cardNo ||
            rawPayload.employeeNo ||
            rawPayload.userId ||
            rawPayload.pin ||
            "");
        const timeStr = event.time ||
            event.dateTime ||
            rawPayload.time ||
            rawPayload.timestamp ||
            Date.now();
        const deviceId = event.devName ||
            event.deviceName ||
            rawPayload.devIndex ||
            rawPayload.mac ||
            rawPayload.ipAddress ||
            "HIKVISION_TERMINAL";
        return {
            employeeUserId,
            timestamp: new Date(timeStr),
            deviceType: "HIKVISION",
            deviceId: String(deviceId),
        };
    }
}
exports.HikvisionAdapter = HikvisionAdapter;

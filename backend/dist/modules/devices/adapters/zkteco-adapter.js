"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZktecoAdapter = void 0;
class ZktecoAdapter {
    parsePayload(rawPayload) {
        const employeeUserId = String(rawPayload.userId ||
            rawPayload.pin ||
            rawPayload.user_id ||
            rawPayload.enroll_id ||
            rawPayload.cardNo ||
            rawPayload.employeeNo ||
            "");
        const timeStr = rawPayload.attTime ||
            rawPayload.time ||
            rawPayload.timestamp ||
            rawPayload.checkTime ||
            rawPayload.punch_time ||
            Date.now();
        const deviceId = rawPayload.sn ||
            rawPayload.deviceSn ||
            rawPayload.device_sn ||
            rawPayload.alias ||
            "ZKTECO_TERMINAL";
        return {
            employeeUserId,
            timestamp: new Date(timeStr),
            deviceType: "ZKTECO",
            deviceId: String(deviceId),
        };
    }
}
exports.ZktecoAdapter = ZktecoAdapter;

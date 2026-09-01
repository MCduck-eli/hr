import { DeviceAttendanceLog, IDeviceAdapter } from "../device-interface";

export class ZktecoAdapter implements IDeviceAdapter {
    parsePayload(rawPayload: any): DeviceAttendanceLog {
        const employeeUserId = String(
            rawPayload.userId ||
            rawPayload.pin ||
            rawPayload.user_id ||
            rawPayload.enroll_id ||
            rawPayload.cardNo ||
            rawPayload.employeeNo ||
            ""
        );

        const timeStr =
            rawPayload.attTime ||
            rawPayload.time ||
            rawPayload.timestamp ||
            rawPayload.checkTime ||
            rawPayload.punch_time ||
            Date.now();

        const deviceId =
            rawPayload.sn ||
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

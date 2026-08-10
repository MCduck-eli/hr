import { DeviceAttendanceLog, IDeviceAdapter } from "../device-interface";

export class ZktecoAdapter implements IDeviceAdapter {
    parsePayload(rawPayload: any): DeviceAttendanceLog {
        return {
            employeeUserId: String(rawPayload.userId || rawPayload.pin),
            timestamp: new Date(rawPayload.attTime || rawPayload.timestamp),
            deviceType: "ZKTECO",
            deviceId: rawPayload.sn,
        };
    }
}

import { DeviceAttendanceLog, IDeviceAdapter } from "../device-interface";

export class HikvisionAdapter implements IDeviceAdapter {
    parsePayload(rawPayload: any): DeviceAttendanceLog {
        return {
            employeeUserId:
                rawPayload.AccessControllerEvent?.employeeNo ||
                rawPayload.employeeNo,
            timestamp: new Date(
                rawPayload.AccessControllerEvent?.time || Date.now(),
            ),
            deviceType: "HIKVISION",
            deviceId:
                rawPayload.AccessControllerEvent?.devName ||
                rawPayload.devIndex,
        };
    }
}

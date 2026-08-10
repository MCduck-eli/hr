export interface DeviceAttendanceLog {
    employeeUserId: string;
    timestamp: Date;
    deviceType: string;
    deviceId?: string;
}

export interface IDeviceAdapter {
    parsePayload(rawPayload: any): DeviceAttendanceLog;
}

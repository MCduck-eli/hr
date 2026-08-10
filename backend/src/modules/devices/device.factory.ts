import { AppError } from "../../utils/appError";
import { HikvisionAdapter } from "./adapters/hikvision-adapter";
import { ZktecoAdapter } from "./adapters/zkteco-adapter";
import { IDeviceAdapter } from "./device-interface";

export class DeviceAdapterFactory {
    static getAdapter(provider: string): IDeviceAdapter {
        switch (provider.toUpperCase()) {
            case "HIKVISION":
                return new HikvisionAdapter();
            case "ZKTECO":
                return new ZktecoAdapter();
            default:
                throw new AppError(
                    `Unsupported device provider: ${provider}`,
                    400,
                );
        }
    }
}

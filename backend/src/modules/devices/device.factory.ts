import { AppError } from "../../utils/appError";
import { HikvisionAdapter } from "./adapters/hikvision-adapter";
import { ZktecoAdapter } from "./adapters/zkteco-adapter";
import { AnvizAdapter } from "./adapters/anviz-adapter";
import { IDeviceAdapter } from "./device-interface";

export class DeviceAdapterFactory {
    static getAdapter(provider: string): IDeviceAdapter {
        const normalized = (provider || "").toUpperCase().replace(/[-_\s]/g, "");

        switch (normalized) {
            case "HIKVISION":
            case "HIK":
            case "HIKISAPI":
                return new HikvisionAdapter();
            case "ZKTECO":
            case "ZK":
            case "ZKT":
            case "ZKBIOTIME":
                return new ZktecoAdapter();
            case "ANVIZ":
            case "CROSSCHEX":
            case "FACEPASS":
                return new AnvizAdapter();
            default:
                throw new AppError(
                    `Unsupported device provider: ${provider}`,
                    400,
                );
        }
    }
}

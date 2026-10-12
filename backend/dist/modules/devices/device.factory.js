"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceAdapterFactory = void 0;
const appError_1 = require("../../utils/appError");
const hikvision_adapter_1 = require("./adapters/hikvision-adapter");
const zkteco_adapter_1 = require("./adapters/zkteco-adapter");
const anviz_adapter_1 = require("./adapters/anviz-adapter");
class DeviceAdapterFactory {
    static getAdapter(provider) {
        const normalized = (provider || "").toUpperCase().replace(/[-_\s]/g, "");
        switch (normalized) {
            case "HIKVISION":
            case "HIK":
            case "HIKISAPI":
                return new hikvision_adapter_1.HikvisionAdapter();
            case "ZKTECO":
            case "ZK":
            case "ZKT":
            case "ZKBIOTIME":
                return new zkteco_adapter_1.ZktecoAdapter();
            case "ANVIZ":
            case "CROSSCHEX":
            case "FACEPASS":
                return new anviz_adapter_1.AnvizAdapter();
            default:
                throw new appError_1.AppError(`Unsupported device provider: ${provider}`, 400);
        }
    }
}
exports.DeviceAdapterFactory = DeviceAdapterFactory;

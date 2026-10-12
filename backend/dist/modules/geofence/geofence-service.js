"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geofenceService = exports.GeofenceService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
class GeofenceService {
    async createZone(payload) {
        return db_1.default.geofenceZone.create({
            data: payload,
        });
    }
    async getAllZones() {
        return db_1.default.geofenceZone.findMany({
            include: {
                department: { select: { id: true, name: true } },
            },
        });
    }
    async deleteZone(id) {
        const zone = await db_1.default.geofenceZone.findUnique({ where: { id } });
        if (!zone) {
            throw new appError_1.AppError("Geofence zone not found", 404);
        }
        return db_1.default.geofenceZone.delete({ where: { id } });
    }
}
exports.GeofenceService = GeofenceService;
exports.geofenceService = new GeofenceService();

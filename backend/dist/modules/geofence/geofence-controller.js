"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geofenceController = exports.GeofenceController = void 0;
const geofence_service_1 = require("./geofence-service");
class GeofenceController {
    async create(req, res, next) {
        try {
            const result = await geofence_service_1.geofenceService.createZone(req.body);
            res.status(201).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getAll(req, res, next) {
        try {
            const result = await geofence_service_1.geofenceService.getAllZones();
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const result = await geofence_service_1.geofenceService.deleteZone(req.params.id);
            res.status(200).json({ status: "success", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.GeofenceController = GeofenceController;
exports.geofenceController = new GeofenceController();

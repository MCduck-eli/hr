import { Request, Response, NextFunction } from "express";
import { geofenceService } from "./geofence-service";

export class GeofenceController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await geofenceService.createZone(req.body);
            res.status(201).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await geofenceService.getAllZones();
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async delete(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const result = await geofenceService.deleteZone(req.params.id);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const geofenceController = new GeofenceController();

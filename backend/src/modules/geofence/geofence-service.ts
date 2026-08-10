import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class GeofenceService {
    async createZone(payload: {
        name: string;
        latitude: number;
        longitude: number;
        radius?: number;
        departmentId?: string;
    }) {
        return prisma.geofenceZone.create({
            data: payload,
        });
    }

    async getAllZones() {
        return prisma.geofenceZone.findMany({
            include: {
                department: { select: { id: true, name: true } },
            },
        });
    }

    async deleteZone(id: string) {
        const zone = await prisma.geofenceZone.findUnique({ where: { id } });
        if (!zone) {
            throw new AppError("Geofence zone not found", 404);
        }
        return prisma.geofenceZone.delete({ where: { id } });
    }
}

export const geofenceService = new GeofenceService();

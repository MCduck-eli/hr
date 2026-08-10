import { z } from "zod";

export const createGeofenceSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        latitude: z.number(),
        longitude: z.number(),
        radius: z.number().positive().default(100),
        departmentId: z.string().uuid().optional(),
    }),
});

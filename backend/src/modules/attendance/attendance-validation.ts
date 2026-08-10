import { z } from "zod";

export const gpsCheckInSchema = z.object({
    body: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
        isSpoofed: z.boolean().optional(),
    }),
});

export const gpsCheckOutSchema = z.object({
    body: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
        isSpoofed: z.boolean().optional(),
    }),
});

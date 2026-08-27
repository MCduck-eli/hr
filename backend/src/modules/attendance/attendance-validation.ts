import { z } from "zod";

export const checkInSchema = z.object({
    body: z
        .object({
            note: z.string().optional(),
            image: z.string().optional(),
            userId: z.string().optional(),
        })
        .optional(),
});

export const checkOutSchema = z.object({
    body: z
        .object({
            note: z.string().optional(),
            image: z.string().optional(),
            userId: z.string().optional(),
        })
        .optional(),
});

export const getAttendanceQuerySchema = z.object({
    query: z
        .object({
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            employeeId: z.string().optional(),
            userId: z.string().optional(),
        })
        .optional(),
});

export const gpsCheckInSchema = z.object({
    body: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
        isSpoofed: z.boolean().optional(),
        userId: z.string().optional(),
    }),
});

export const gpsCheckOutSchema = z.object({
    body: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
        isSpoofed: z.boolean().optional(),
        userId: z.string().optional(),
    }),
});

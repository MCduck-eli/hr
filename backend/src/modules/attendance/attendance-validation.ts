import { z } from "zod";

export const checkInSchema = z.object({
    body: z.object({
        note: z.string().optional(),
    }),
});

export const checkOutSchema = z.object({
    body: z.object({
        note: z.string().optional(),
    }),
});

export const getAttendanceQuerySchema = z.object({
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        employeeId: z.string().uuid().optional(),
    }),
});

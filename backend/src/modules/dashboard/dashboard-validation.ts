import { z } from "zod";

export const getDashboardSchema = z.object({
    query: z.object({
        year: z.string().optional(),
        month: z.string().optional(),
        userId: z.string().optional(),
    }),
});

import { z } from "zod";

export const createPerformanceReviewSchema = z.object({
    body: z.object({
        employeeId: z.string().uuid(),
        score: z.number().min(1).max(10),
        feedback: z.string().min(5),
        period: z.string().min(3),
    }),
});

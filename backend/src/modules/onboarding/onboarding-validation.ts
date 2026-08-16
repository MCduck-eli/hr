import { z } from "zod";

export const createTemplateSchema = z.object({
    body: z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        departmentId: z.string().uuid().optional(),
        tasks: z
            .array(
                z.object({
                    title: z.string().min(2),
                    description: z.string().optional(),
                    stage: z.enum(["DAY_1", "WEEK_1", "MONTH_1", "MONTH_3"]),
                }),
            )
            .optional(),
        courses: z
            .array(
                z.object({
                    title: z.string().min(2),
                    videoUrl: z.string().url(),
                    description: z.string().optional(),
                }),
            )
            .optional(),
    }),
});

export const assignOnboardingSchema = z.object({
    body: z.object({
        employeeId: z.string().uuid(),
    }),
});

export const updateTaskStatusSchema = z.object({
    body: z.object({
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
    }),
});

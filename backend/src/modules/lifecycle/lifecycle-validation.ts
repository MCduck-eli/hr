import { z } from "zod";

export const createTemplateSchema = z.object({
    body: z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        stage: z.enum([
            "PRE_HIRE",
            "ONBOARDING",
            "PROBATION",
            "REGULAR_WORK",
            "PROMOTION",
            "OFFBOARDING",
        ]),
        tasks: z.array(
            z.object({
                title: z.string().min(2),
                description: z.string().optional(),
                dueDays: z.number().int(),
            }),
        ),
    }),
});

export const applyTemplateSchema = z.object({
    body: z.object({
        templateId: z.string().uuid(),
    }),
});

export const updateChecklistStatusSchema = z.object({
    body: z.object({
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
    }),
});
export const updateOffboardingTaskSchema = z.object({
    body: z.object({
        isCompleted: z.boolean(),
    }),
});
export const exportJourneySchema = z.object({
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        eventType: z.string().optional(),
        format: z.enum(["csv", "json"]).default("csv"),
    }),
});

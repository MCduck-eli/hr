import { z } from "zod";

export const createCycleSchema = z.object({
    body: z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        questions: z
            .array(
                z.object({
                    competency: z.string().min(2),
                    text: z.string().min(3),
                    order: z.number().int().optional(),
                }),
            )
            .min(1),
    }),
});

export const assignReviewersSchema = z.object({
    body: z.object({
        cycleId: z.string().uuid(),
        targetId: z.string().uuid(),
        reviewers: z
            .array(
                z.object({
                    reviewerId: z.string().uuid(),
                    type: z.enum(["SELF", "MANAGER", "PEER", "SUBORDINATE"]),
                }),
            )
            .min(1),
    }),
});

export const submitFeedbackSchema = z.object({
    body: z.object({
        answers: z
            .array(
                z.object({
                    questionId: z.string().uuid(),
                    score: z.number().int().min(1).max(5),
                    comment: z.string().optional(),
                }),
            )
            .min(1),
    }),
});

import { z } from "zod";

export const createCycleSchema = z.object({
    body: z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        questions: z
            .array(
                z.object({
                    competency: z.string().min(1),
                    text: z.string().min(1),
                    order: z.number().int().optional(),
                }),
            )
            .optional()
            .default([]),
    }),
});

export const getAssignmentsSchema = z.object({
    query: z.object({
        cycleId: z.string().uuid(),
        targetId: z.string().uuid().optional(),
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

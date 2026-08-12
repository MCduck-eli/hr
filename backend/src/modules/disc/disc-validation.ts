import { z } from "zod";

export const createQuestionSchema = z.object({
    body: z.object({
        text: z.string().min(3),
        order: z.number().int().optional(),
        options: z
            .array(
                z.object({
                    text: z.string().min(1),
                    discType: z.enum(["D", "I", "S", "C"]),
                    score: z.number().int().default(1),
                }),
            )
            .min(4),
    }),
});

export const submitAssessmentSchema = z.object({
    body: z.object({
        answers: z
            .array(
                z.object({
                    questionId: z.string().uuid(),
                    optionId: z.string().uuid(),
                }),
            )
            .min(1),
    }),
});

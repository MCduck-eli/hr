import { z } from "zod";

export const createCourseSchema = z.object({
    body: z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        coverUrl: z.string().url().optional(),
        isRequired: z.boolean().optional(),
    }),
});

export const addLessonSchema = z.object({
    body: z.object({
        title: z.string().min(3),
        videoUrl: z.string().url(),
        content: z.string().optional(),
        order: z.number().int().optional(),
    }),
});

export const submitQuizSchema = z.object({
    body: z.object({
        answers: z.array(
            z.object({
                quizId: z.string().uuid(),
                selectedOption: z.number().int(),
            }),
        ),
    }),
});

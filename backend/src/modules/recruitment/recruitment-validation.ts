import { z } from "zod";

export const createVacancySchema = z.object({
    body: z.object({
        title: z.string().min(3),
        description: z.string().min(10),
        requirements: z.string().min(10),
        departmentId: z.string().uuid().optional(),
    }),
});

export const applyCandidateSchema = z.object({
    body: z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(7),
        resumeUrl: z.string().url(),
        resumeText: z.string().min(10),
        source: z.string().optional(),
    }),
});

export const updateStageSchema = z.object({
    body: z.object({
        stage: z.enum([
            "APPLIED",
            "SCREENING",
            "INTERVIEW",
            "TEST_TASK",
            "OFFER",
            "HIRED",
            "REJECTED",
        ]),
    }),
});

export const addFeedbackSchema = z.object({
    body: z.object({
        score: z.number().min(1).max(10),
        comment: z.string().min(3),
    }),
});

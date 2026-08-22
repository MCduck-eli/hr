import { z } from "zod";

export const createVacancySchema = z.object({
    body: z.object({
        title: z.string().min(3),
        companyName: z.string().optional(),
        description: z.string().min(10),
        requirements: z.string(),
    }),
});

export const updateVacancySchema = z.object({
    body: z.object({
        title: z.string().min(3).optional(),
        companyName: z.string().optional(),
        description: z.string().min(10).optional(),
        requirements: z.string().optional(),
    }),
});

export const applyCandidateSchema = z.object({
    body: z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        resumeUrl: z.string().optional(),
        resumeText: z.string().optional(),
        source: z.string().optional(),
        vacancyId: z.string().uuid().optional(),
        location: z.string().optional(),
        coverLetter: z.string().optional(),
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

export const sendCandidateEmailSchema = z.object({
    body: z.object({
        subject: z.string().min(2),
        text: z.string().min(2),
        type: z.enum(["HIRE", "REJECT", "INTERVIEW", "CUSTOM"]),
    }),
});

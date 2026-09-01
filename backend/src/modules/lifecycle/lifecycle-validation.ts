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

export const createLifecycleEventSchema = z.object({
    body: z.object({
        eventType: z.enum([
            "VACANCY_CREATED",
            "CANDIDATE_APPLIED",
            "OFFER_ACCEPTED",
            "HIRED",
            "ONBOARDING_STARTED",
            "ONBOARDING_COMPLETED",
            "PROBATION_PASSED",
            "PROMOTED",
            "DEPARTMENT_CHANGED",
            "COURSE_COMPLETED",
            "CERTIFICATE_EARNED",
            "PERFORMANCE_REVIEWED",
            "OFFBOARDING_STARTED",
            "EXIT_INTERVIEW_COMPLETED",
            "TERMINATED",
        ]),
        title: z.string().min(2),
        description: z.string().optional(),
        eventDate: z.string().optional(),
        metadata: z.any().optional(),
    }),
});

export const updateLifecycleEventSchema = z.object({
    body: z.object({
        eventType: z.enum([
            "VACANCY_CREATED",
            "CANDIDATE_APPLIED",
            "OFFER_ACCEPTED",
            "HIRED",
            "ONBOARDING_STARTED",
            "ONBOARDING_COMPLETED",
            "PROBATION_PASSED",
            "PROMOTED",
            "DEPARTMENT_CHANGED",
            "COURSE_COMPLETED",
            "CERTIFICATE_EARNED",
            "PERFORMANCE_REVIEWED",
            "OFFBOARDING_STARTED",
            "EXIT_INTERVIEW_COMPLETED",
            "TERMINATED",
        ]).optional(),
        title: z.string().min(2).optional(),
        description: z.string().optional(),
        eventDate: z.string().optional(),
        metadata: z.any().optional(),
    }),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLifecycleEventSchema = exports.createLifecycleEventSchema = exports.exportJourneySchema = exports.updateOffboardingTaskSchema = exports.updateChecklistStatusSchema = exports.applyTemplateSchema = exports.createTemplateSchema = void 0;
const zod_1 = require("zod");
exports.createTemplateSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        description: zod_1.z.string().optional(),
        stage: zod_1.z.enum([
            "PRE_HIRE",
            "ONBOARDING",
            "PROBATION",
            "REGULAR_WORK",
            "PROMOTION",
            "OFFBOARDING",
        ]),
        tasks: zod_1.z.array(zod_1.z.object({
            title: zod_1.z.string().min(2),
            description: zod_1.z.string().optional(),
            dueDays: zod_1.z.number().int(),
        })),
    }),
});
exports.applyTemplateSchema = zod_1.z.object({
    body: zod_1.z.object({
        templateId: zod_1.z.string().uuid(),
    }),
});
exports.updateChecklistStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
    }),
});
exports.updateOffboardingTaskSchema = zod_1.z.object({
    body: zod_1.z.object({
        isCompleted: zod_1.z.boolean(),
    }),
});
exports.exportJourneySchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        eventType: zod_1.z.string().optional(),
        format: zod_1.z.enum(["csv", "json"]).default("csv"),
    }),
});
exports.createLifecycleEventSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventType: zod_1.z.enum([
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
        title: zod_1.z.string().min(2),
        description: zod_1.z.string().optional(),
        eventDate: zod_1.z.string().optional(),
        metadata: zod_1.z.any().optional(),
    }),
});
exports.updateLifecycleEventSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventType: zod_1.z.enum([
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
        title: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().optional(),
        eventDate: zod_1.z.string().optional(),
        metadata: zod_1.z.any().optional(),
    }),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCandidateEmailSchema = exports.addFeedbackSchema = exports.submitTaskSchema = exports.updateStageSchema = exports.applyCandidateSchema = exports.updateVacancySchema = exports.createVacancySchema = void 0;
const zod_1 = require("zod");
exports.createVacancySchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        companyName: zod_1.z.string().optional().nullable(),
        description: zod_1.z.string().min(10),
        requirements: zod_1.z.string(),
        departmentId: zod_1.z.string().optional().nullable(),
    }),
});
exports.updateVacancySchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        companyName: zod_1.z.string().optional().nullable(),
        description: zod_1.z.string().min(10).optional(),
        requirements: zod_1.z.string().optional(),
        departmentId: zod_1.z.string().optional().nullable(),
    }),
});
exports.applyCandidateSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string().optional(),
        resumeUrl: zod_1.z.string().optional(),
        resumeText: zod_1.z.string().optional(),
        source: zod_1.z.string().optional(),
        vacancyId: zod_1.z.string().uuid().optional(),
        location: zod_1.z.string().optional(),
        coverLetter: zod_1.z.string().optional(),
    }),
});
exports.updateStageSchema = zod_1.z.object({
    body: zod_1.z.object({
        stage: zod_1.z.enum([
            "APPLIED",
            "SCREENING",
            "INTERVIEW",
            "TEST_TASK",
            "OFFER",
            "HIRED",
            "REJECTED",
        ]),
        testTaskDeadline: zod_1.z.string().optional().nullable(),
    }),
});
exports.submitTaskSchema = zod_1.z.object({
    body: zod_1.z.object({
        submissionUrl: zod_1.z.string().optional(),
        submissionFile: zod_1.z.string().optional(),
        submissionNote: zod_1.z.string().optional(),
    }),
});
exports.addFeedbackSchema = zod_1.z.object({
    body: zod_1.z.object({
        score: zod_1.z.number().min(1).max(10),
        comment: zod_1.z.string().min(3),
    }),
});
exports.sendCandidateEmailSchema = zod_1.z.object({
    body: zod_1.z.object({
        subject: zod_1.z.string().min(2),
        text: zod_1.z.string().min(2),
        type: zod_1.z.string().min(1),
    }),
});

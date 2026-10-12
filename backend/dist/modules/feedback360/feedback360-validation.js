"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitFeedbackSchema = exports.assignReviewersSchema = exports.getAssignmentsSchema = exports.createCycleSchema = void 0;
const zod_1 = require("zod");
exports.createCycleSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1),
        description: zod_1.z.string().optional().nullable(),
        startDate: zod_1.z.string().min(1),
        endDate: zod_1.z.string().min(1),
        questions: zod_1.z
            .array(zod_1.z.object({
            competency: zod_1.z.string().min(1),
            text: zod_1.z.string().min(1),
            order: zod_1.z.number().int().optional(),
        }))
            .optional()
            .default([]),
    }),
});
exports.getAssignmentsSchema = zod_1.z.object({
    query: zod_1.z.object({
        cycleId: zod_1.z.string().uuid(),
        targetId: zod_1.z.string().uuid().optional(),
    }),
});
exports.assignReviewersSchema = zod_1.z.object({
    body: zod_1.z.object({
        cycleId: zod_1.z.string().uuid(),
        targetId: zod_1.z.string().uuid(),
        reviewers: zod_1.z
            .array(zod_1.z.object({
            reviewerId: zod_1.z.string().uuid(),
            type: zod_1.z.enum(["SELF", "MANAGER", "PEER", "SUBORDINATE"]),
        }))
    }),
});
exports.submitFeedbackSchema = zod_1.z.object({
    body: zod_1.z.object({
        answers: zod_1.z
            .array(zod_1.z.object({
            questionId: zod_1.z.string().uuid(),
            score: zod_1.z.number().int().min(1).max(5),
            comment: zod_1.z.string().optional(),
        }))
            .min(1),
    }),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitAssessmentSchema = exports.createQuestionSchema = void 0;
const zod_1 = require("zod");
exports.createQuestionSchema = zod_1.z.object({
    body: zod_1.z.object({
        text: zod_1.z.string().min(3),
        order: zod_1.z.number().int().optional(),
        options: zod_1.z
            .array(zod_1.z.object({
            text: zod_1.z.string().min(1),
            discType: zod_1.z.enum(["D", "I", "S", "C"]),
            score: zod_1.z.number().int().default(1),
        }))
            .min(4),
    }),
});
exports.submitAssessmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        answers: zod_1.z
            .array(zod_1.z.object({
            questionId: zod_1.z.string().uuid(),
            optionId: zod_1.z.string().uuid(),
        }))
            .min(1),
    }),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approvePromotionSchema = exports.requestPromotionSchema = exports.updateGradeSchema = exports.createGradeSchema = void 0;
const zod_1 = require("zod");
exports.createGradeSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1),
        title: zod_1.z.string().min(1),
        level: zod_1.z.coerce.number().int().min(1),
        minSalary: zod_1.z.coerce.number().min(0),
        maxSalary: zod_1.z.coerce.number().min(0),
        requirements: zod_1.z.string().optional().nullable(),
        responsibilities: zod_1.z.string().optional().nullable(),
        companyName: zod_1.z.string().optional().nullable(),
    }),
});
exports.updateGradeSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1).optional(),
        title: zod_1.z.string().min(1).optional(),
        level: zod_1.z.coerce.number().int().min(1).optional(),
        minSalary: zod_1.z.coerce.number().min(0).optional(),
        maxSalary: zod_1.z.coerce.number().min(0).optional(),
        requirements: zod_1.z.string().optional().nullable(),
        responsibilities: zod_1.z.string().optional().nullable(),
    }),
});
exports.requestPromotionSchema = zod_1.z.object({
    body: zod_1.z.object({
        employeeId: zod_1.z.string().min(1),
        targetGradeId: zod_1.z.string().min(1),
        proposedSalary: zod_1.z.coerce.number().min(0),
        reason: zod_1.z.string().min(1),
    }),
});
exports.approvePromotionSchema = zod_1.z.object({
    body: zod_1.z.object({
        action: zod_1.z.enum(["APPROVE", "REJECT"]),
    }),
});

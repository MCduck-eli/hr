"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateObjectiveSchema = exports.updateOkrStatusSchema = exports.checkInKeyResultSchema = exports.createObjectiveSchema = exports.createCycleSchema = void 0;
const zod_1 = require("zod");
exports.createCycleSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1),
        startDate: zod_1.z.string().min(1),
        endDate: zod_1.z.string().min(1),
        isCurrent: zod_1.z.boolean().optional(),
        minExpectedProgress: zod_1.z.coerce.number().optional(),
    }),
});
exports.createObjectiveSchema = zod_1.z.object({
    body: zod_1.z.object({
        cycleId: zod_1.z.string().optional().nullable(),
        level: zod_1.z.enum(["COMPANY", "DEPARTMENT", "INDIVIDUAL"]),
        title: zod_1.z.string().min(1),
        description: zod_1.z.string().optional().nullable(),
        departmentId: zod_1.z.string().optional().nullable(),
        employeeId: zod_1.z.string().optional().nullable(),
        parentId: zod_1.z.string().optional().nullable(),
        minExpectedProgress: zod_1.z.coerce.number().optional().nullable(),
        isIndividualForEach: zod_1.z.boolean().optional().nullable(),
        executionMode: zod_1.z.string().optional().nullable(),
        keyResults: zod_1.z
            .array(zod_1.z.object({
            id: zod_1.z.string().optional().nullable(),
            title: zod_1.z.string().min(1),
            initialValue: zod_1.z.coerce.number().default(0).optional(),
            targetValue: zod_1.z.coerce.number(),
            unit: zod_1.z.string().optional().default("%"),
        }))
            .optional()
            .default([]),
    }),
});
exports.checkInKeyResultSchema = zod_1.z.object({
    body: zod_1.z.object({
        comment: zod_1.z.string().optional().nullable(),
        progress: zod_1.z.coerce.number().optional().nullable(),
        percentage: zod_1.z.coerce.number().optional().nullable(),
        value: zod_1.z.coerce.number().optional().nullable(),
    }),
});
exports.updateOkrStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(["SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"]),
    }),
});
exports.updateObjectiveSchema = zod_1.z.object({
    body: zod_1.z.object({
        level: zod_1.z.enum(["COMPANY", "DEPARTMENT", "INDIVIDUAL"]).optional(),
        title: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional().nullable(),
        departmentId: zod_1.z.string().optional().nullable(),
        employeeId: zod_1.z.string().optional().nullable(),
        parentId: zod_1.z.string().optional().nullable(),
        minExpectedProgress: zod_1.z.coerce.number().optional().nullable(),
        isIndividualForEach: zod_1.z.boolean().optional().nullable(),
        executionMode: zod_1.z.string().optional().nullable(),
        keyResults: zod_1.z
            .array(zod_1.z.object({
            id: zod_1.z.string().optional().nullable(),
            title: zod_1.z.string().min(1),
            initialValue: zod_1.z.coerce.number().default(0).optional(),
            targetValue: zod_1.z.coerce.number(),
            unit: zod_1.z.string().optional().default("%"),
        }))
            .optional(),
    }),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskStatusSchema = exports.assignOnboardingSchema = exports.createTemplateSchema = void 0;
const zod_1 = require("zod");
exports.createTemplateSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        targetStatus: zod_1.z.string().optional().nullable(),
        departmentId: zod_1.z.string().optional().nullable(),
        isRequired: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string()]).optional(),
        tasks: zod_1.z
            .array(zod_1.z.object({
            title: zod_1.z.string().min(1),
            description: zod_1.z.string().optional(),
            stage: zod_1.z.enum(["DAY_1", "WEEK_1", "MONTH_1", "MONTH_3"]).optional(),
        }))
            .optional(),
        courses: zod_1.z
            .array(zod_1.z.object({
            title: zod_1.z.string().min(1),
            videoUrl: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
        }))
            .optional(),
    }),
});
exports.assignOnboardingSchema = zod_1.z.object({
    body: zod_1.z.object({
        employeeId: zod_1.z.string().uuid(),
    }),
});
exports.updateTaskStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
    }),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = void 0;
const zod_1 = require("zod");
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        firstName: zod_1.z.string().optional(),
        lastName: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        companyName: zod_1.z.string().optional().nullable(),
        phone: zod_1.z.string().optional().nullable(),
        avatar: zod_1.z.string().optional().nullable(),
        password: zod_1.z.string().optional(),
        departmentId: zod_1.z.string().uuid().optional().nullable().or(zod_1.z.literal("")),
        positionId: zod_1.z.string().uuid().optional().nullable().or(zod_1.z.literal("")),
        role: zod_1.z.string().optional(),
        customRoleId: zod_1.z.string().optional().nullable().or(zod_1.z.literal("")),
        leaveBalance: zod_1.z.any().optional(),
        status: zod_1.z.any().optional(),
        statusConfigId: zod_1.z.any().optional(),
        assignedCourseIds: zod_1.z.array(zod_1.z.string()).optional(),
    })
        .passthrough(),
});

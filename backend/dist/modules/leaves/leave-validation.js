"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeaveStatusSchema = exports.createLeaveSchema = void 0;
const zod_1 = require("zod");
exports.createLeaveSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(["ANNUAL", "SICK", "UNPAID", "MATERNITY", "OTHER"]),
        startDate: zod_1.z
            .string()
            .datetime({ offset: true })
            .or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        endDate: zod_1.z
            .string()
            .datetime({ offset: true })
            .or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        reason: zod_1.z.string().min(5),
    }),
});
exports.updateLeaveStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(["APPROVED", "REJECTED"]),
    }),
});

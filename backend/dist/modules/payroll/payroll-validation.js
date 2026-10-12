"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePayrollStatusSchema = exports.createPayrollSchema = void 0;
const zod_1 = require("zod");
exports.createPayrollSchema = zod_1.z.object({
    body: zod_1.z.object({
        employeeId: zod_1.z.string().uuid(),
        month: zod_1.z.number().int().min(1).max(12),
        year: zod_1.z.number().int().min(2020),
        baseSalary: zod_1.z.number().positive(),
        bonus: zod_1.z.number().nonnegative().optional(),
        deductions: zod_1.z.number().nonnegative().optional(),
    }),
});
exports.updatePayrollStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(["PENDING", "PAID", "CANCELLED"]),
    }),
});

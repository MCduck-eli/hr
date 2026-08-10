import { z } from "zod";

export const createPayrollSchema = z.object({
    body: z.object({
        employeeId: z.string().uuid(),
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(2020),
        baseSalary: z.number().positive(),
        bonus: z.number().nonnegative().optional(),
        deductions: z.number().nonnegative().optional(),
    }),
});

export const updatePayrollStatusSchema = z.object({
    body: z.object({
        status: z.enum(["PENDING", "PAID", "CANCELLED"]),
    }),
});

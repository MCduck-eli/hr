import { z } from "zod";

export const updateUserSchema = z.object({
    body: z.object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        password: z.string().optional(),
        departmentId: z.string().uuid().optional().or(z.literal("")),
        positionId: z.string().uuid().optional().or(z.literal("")),
        role: z
            .enum([
                "SUPER_ADMIN",
                "HR_ADMIN",
                "DEPARTMENT_HEAD",
                "EMPLOYEE",
                "RECRUITER",
                "CANDIDATE",
            ])
            .optional(),
    }),
});

import { z } from "zod";

export const updateUserSchema = z.object({
    body: z.object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        departmentId: z.string().uuid().optional(),
        positionId: z.string().uuid().optional(),
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

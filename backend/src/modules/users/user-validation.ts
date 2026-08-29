import { z } from "zod";

export const updateUserSchema = z.object({
    body: z
        .object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            email: z.string().email().optional(),
            companyName: z.string().optional().nullable(),
            phone: z.string().optional().nullable(),
            password: z.string().optional(),
            departmentId: z.string().uuid().optional().nullable().or(z.literal("")),
            positionId: z.string().uuid().optional().nullable().or(z.literal("")),
            role: z
                .enum([
                    "SUPER_ADMIN",
                    "DIRECTOR",
                    "HR_ADMIN",
                    "DEPARTMENT_HEAD",
                    "EMPLOYEE",
                    "RECRUITER",
                    "CANDIDATE",
                ])
                .optional(),
            leaveBalance: z.any().optional(),
            status: z.any().optional(),
            statusConfigId: z.any().optional(),
            assignedCourseIds: z.array(z.string()).optional(),
        })
        .passthrough(),
});

import { z } from "zod";

export const updateHierarchySchema = z.object({
    body: z.object({
        departmentId: z.string().uuid().optional(),
        positionId: z.string().uuid().optional(),
        managerId: z.string().uuid().nullable().optional(),
        reason: z.string().optional(),
    }),
});

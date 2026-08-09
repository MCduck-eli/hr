import { z } from "zod";

export const createDepartmentSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        parentId: z.string().uuid().optional(),
    }),
});

export const updateDepartmentSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        parentId: z.string().uuid().optional(),
    }),
});

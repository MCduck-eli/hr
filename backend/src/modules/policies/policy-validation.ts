import { z } from "zod";

export const createPolicySchema = z.object({
    body: z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        documentUrl: z.string().url(),
        isRequired: z.boolean().optional(),
    }),
});

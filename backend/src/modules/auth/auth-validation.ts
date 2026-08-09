import { z } from "zod";

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
    }),
});

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().min(2),
        lastName: z.string().min(2),
    }),
});

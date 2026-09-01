import { z } from "zod";

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(2),
        description: z.string().optional(),
    }),
});

export const createCourseSchema = z.object({
    body: z.object({
        title: z.string().min(3),
        description: z.string().optional().nullable(),
        coverUrl: z.string().optional().nullable(),
        videoUrl: z.string().optional().nullable(),
        isRequired: z.boolean().optional().nullable(),
        categoryId: z.string().uuid().optional().nullable(),
        targetDepartmentId: z.string().uuid().optional().nullable(),
        targetEmployeeId: z.string().uuid().optional().nullable(),
        targetStatusConfigId: z.string().uuid().optional().nullable(),
    }),
});

export const addLessonSchema = z.object({
    body: z.object({
        title: z.string().min(3),
        videoUrl: z.string().url(),
        content: z.string().optional(),
        order: z.number().int().optional(),
    }),
});

export const addResourceSchema = z.object({
    body: z.object({
        title: z.string().min(2),
        fileUrl: z.string().url(),
        fileType: z.string(),
    }),
});

export const createEventSchema = z.object({
    body: z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        eventType: z.enum(["ONLINE", "OFFLINE"]),
        locationOrUrl: z.string().min(3),
        eventDate: z.string().datetime(),
        capacity: z.number().int().min(1),
    }),
});

export const submitQuizSchema = z.object({
    body: z.object({
        answers: z.array(
            z.object({
                quizId: z.string().uuid(),
                selectedOption: z.number().int(),
            }),
        ),
    }),
});

export const assignAcademySchema = z.object({
    body: z.object({
        employeeId: z.string().uuid(),
    }),
});

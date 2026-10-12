"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignAcademySchema = exports.submitQuizSchema = exports.createEventSchema = exports.addResourceSchema = exports.addLessonSchema = exports.createCourseSchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        description: zod_1.z.string().optional(),
    }),
});
exports.createCourseSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        description: zod_1.z.string().optional().nullable(),
        coverUrl: zod_1.z.string().optional().nullable(),
        videoUrl: zod_1.z.string().optional().nullable(),
        isRequired: zod_1.z.boolean().optional().nullable(),
        categoryId: zod_1.z.string().uuid().optional().nullable(),
        targetDepartmentId: zod_1.z.string().uuid().optional().nullable(),
        targetEmployeeId: zod_1.z.string().uuid().optional().nullable(),
        targetStatusConfigId: zod_1.z.string().uuid().optional().nullable(),
    }),
});
exports.addLessonSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        videoUrl: zod_1.z.string().url(),
        content: zod_1.z.string().optional(),
        order: zod_1.z.number().int().optional(),
    }),
});
exports.addResourceSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(2),
        fileUrl: zod_1.z.string().url(),
        fileType: zod_1.z.string(),
    }),
});
exports.createEventSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        description: zod_1.z.string().optional(),
        eventType: zod_1.z.enum(["ONLINE", "OFFLINE"]),
        locationOrUrl: zod_1.z.string().min(3),
        eventDate: zod_1.z.string().datetime(),
        capacity: zod_1.z.number().int().min(1),
    }),
});
exports.submitQuizSchema = zod_1.z.object({
    body: zod_1.z.object({
        answers: zod_1.z.array(zod_1.z.object({
            quizId: zod_1.z.string().uuid(),
            selectedOption: zod_1.z.number().int(),
        })),
    }),
});
exports.assignAcademySchema = zod_1.z.object({
    body: zod_1.z.object({
        employeeId: zod_1.z.string().uuid(),
    }),
});

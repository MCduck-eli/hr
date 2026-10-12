"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gpsCheckOutSchema = exports.gpsCheckInSchema = exports.getAttendanceQuerySchema = exports.checkOutSchema = exports.checkInSchema = void 0;
const zod_1 = require("zod");
exports.checkInSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        note: zod_1.z.string().optional(),
        image: zod_1.z.string().optional(),
        userId: zod_1.z.string().optional(),
    })
        .optional(),
});
exports.checkOutSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        note: zod_1.z.string().optional(),
        image: zod_1.z.string().optional(),
        userId: zod_1.z.string().optional(),
    })
        .optional(),
});
exports.getAttendanceQuerySchema = zod_1.z.object({
    query: zod_1.z
        .object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        employeeId: zod_1.z.string().optional(),
        userId: zod_1.z.string().optional(),
    })
        .optional(),
});
exports.gpsCheckInSchema = zod_1.z.object({
    body: zod_1.z.object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
        address: zod_1.z.string().optional(),
        isSpoofed: zod_1.z.boolean().optional(),
        userId: zod_1.z.string().optional(),
    }),
});
exports.gpsCheckOutSchema = zod_1.z.object({
    body: zod_1.z.object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
        address: zod_1.z.string().optional(),
        isSpoofed: zod_1.z.boolean().optional(),
        userId: zod_1.z.string().optional(),
    }),
});

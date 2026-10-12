"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGeofenceSchema = void 0;
const zod_1 = require("zod");
exports.createGeofenceSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
        radius: zod_1.z.number().positive().default(100),
        departmentId: zod_1.z.string().uuid().optional(),
    }),
});

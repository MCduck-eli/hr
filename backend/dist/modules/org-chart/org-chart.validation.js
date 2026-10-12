"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHierarchySchema = void 0;
const zod_1 = require("zod");
exports.updateHierarchySchema = zod_1.z.object({
    body: zod_1.z.object({
        departmentId: zod_1.z.string().uuid().optional(),
        positionId: zod_1.z.string().uuid().optional(),
        managerId: zod_1.z.string().uuid().nullable().optional(),
        matrixManagerIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
        reason: zod_1.z.string().optional(),
    }),
});

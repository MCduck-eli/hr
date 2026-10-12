"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPerformanceReviewSchema = void 0;
const zod_1 = require("zod");
exports.createPerformanceReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        employeeId: zod_1.z.string().uuid(),
        score: zod_1.z.number().min(1).max(10),
        feedback: zod_1.z.string().min(5),
        period: zod_1.z.string().min(3),
    }),
});

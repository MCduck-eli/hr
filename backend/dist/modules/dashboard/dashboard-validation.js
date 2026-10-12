"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSchema = void 0;
const zod_1 = require("zod");
exports.getDashboardSchema = zod_1.z.object({
    query: zod_1.z.object({
        year: zod_1.z.string().optional(),
        month: zod_1.z.string().optional(),
        userId: zod_1.z.string().optional(),
    }),
});

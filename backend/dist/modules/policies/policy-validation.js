"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPolicySchema = void 0;
const zod_1 = require("zod");
exports.createPolicySchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        description: zod_1.z.string().optional(),
        documentUrl: zod_1.z.string().url(),
        isRequired: zod_1.z.boolean().optional(),
    }),
});

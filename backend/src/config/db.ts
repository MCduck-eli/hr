import { PrismaClient } from "@prisma/client";

const basePrisma = new PrismaClient({
    log: ["error"],
});

const prismaWithExtension = basePrisma.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const before = performance.now();
                try {
                    const result = await query(args);
                    const after = performance.now();
                    console.log(`[Prisma Query] ${model}.${operation} -> ${Math.round(after - before)}ms`);
                    return result;
                } catch (error) {
                    const after = performance.now();
                    console.log(`[Prisma Query] ${model}.${operation} -> ${Math.round(after - before)}ms (Error)`);
                    throw error;
                }
            },
        },
    },
});

type ExtendedPrismaClient = typeof prismaWithExtension;

declare global {
    var prisma: ExtendedPrismaClient | undefined;
}

const prisma = global.prisma || prismaWithExtension;

if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

export default prisma;

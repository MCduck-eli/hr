import { Role } from "@prisma/client";
import "multer";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: Role;
            };
            file?: Express.Multer.File;
            files?:
                | { [fieldname: string]: Express.Multer.File[] }
                | Express.Multer.File[];
        }
    }
}

export {};

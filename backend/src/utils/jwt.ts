import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "hr_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

export const generateToken = (payload: object): string => {
    const options: SignOptions = {
        expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
    };

    return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, JWT_SECRET);
};

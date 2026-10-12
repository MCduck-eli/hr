import crypto from "crypto";

export function generateRandomPassword(length: number = 10): string {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghjkmnpqrstuvwxyz";
    const numbers = "23456789";
    const special = "!@#$%*";
    const allChars = uppercase + lowercase + numbers + special;

    const bytes = crypto.randomBytes(length);
    let password = "";

    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += special[crypto.randomInt(0, special.length)];

    for (let i = 4; i < length; i++) {
        password += allChars[bytes[i] % allChars.length];
    }

    return password
        .split("")
        .sort(() => 0.5 - Math.random())
        .join("");
}

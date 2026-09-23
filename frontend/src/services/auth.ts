const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

export async function loginApi(credentials: {
    email: string;
    password: string;
}) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Login failed");
    }

    return data;
}

export async function sendOtpApi(payload: { email: string; checkExisting?: boolean }) {
    const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to send verification code");
    }

    return data;
}

export async function verifyOtpApi(payload: { email: string; code: string }) {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Invalid verification code");
    }

    return data;
}

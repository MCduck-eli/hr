const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function loginApi(credentials: {
    email: string;
    password: string;
    companyName?: string;
    userId?: string;
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

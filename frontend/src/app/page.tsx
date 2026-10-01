import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
    const locale = localeCookie && ["ru", "uz", "en"].includes(localeCookie) ? localeCookie : "uz";

    redirect(`/${locale}`);
}


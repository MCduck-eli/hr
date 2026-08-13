import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

const locales = ["en", "uz", "ru"] as const;
type Locale = (typeof locales)[number];

const messageImports: Record<Locale, () => Promise<any>> = {
    en: () => import("./messages/en.json"),
    uz: () => import("./messages/uz.json"),
    ru: () => import("./messages/ru.json"),
};

export default getRequestConfig(async ({ locale }) => {
    const currentLocale = (locale || "en") as Locale;

    if (!locales.includes(currentLocale)) notFound();

    return {
        locale: currentLocale,
        messages: (await messageImports[currentLocale]()).default,
    };
});

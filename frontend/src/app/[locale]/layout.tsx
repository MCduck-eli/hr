import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import "./globals.css";
import { AppProvider } from "../../context/app-context";
import Navbar from "../../components/layout/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "HR Platform",
    description: "Modern HR Management System",
};

export default async function RootLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const messages = await getMessages({ locale });

    return (
        <html lang={locale}>
            <body
                className={`${inter.className} bg-[#f8f8f8] text-black antialiased min-h-screen relative overflow-x-hidden flex flex-col`}
            >
                <NextIntlClientProvider messages={messages}>
                    <AppProvider>
                        <Navbar />

                        <main className="w-full flex-1">
                            {children}
                        </main>
                    </AppProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}

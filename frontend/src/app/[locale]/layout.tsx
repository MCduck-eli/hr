import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import "./globals.css";
import Footer from "../../components/layout/footer";
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
                        <div className="absolute inset-0 z-0 pointer-events-none flex justify-center">
                            <div className="w-full max-w-[1400px] h-full grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-0 border-x border-gray-200/50">
                                <div className="border-r border-gray-200/50 h-full hidden md:block"></div>
                                <div className="border-r border-gray-200/50 h-full hidden md:block"></div>
                                <div className="border-r border-gray-200/50 h-full hidden lg:block"></div>
                                <div className="border-r border-gray-200/50 h-full hidden lg:block"></div>
                                <div className="border-r border-gray-200/50 h-full hidden lg:block"></div>
                                <div className="h-full"></div>
                            </div>
                        </div>

                        <Navbar />

                        <main className="w-full max-w-[1400px] mx-auto flex-1 min-h-[calc(100vh-300px)]">
                            {children}
                        </main>
                    </AppProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}

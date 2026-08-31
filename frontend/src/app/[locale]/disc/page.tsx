import DiscTestManager from "@/src/components/disc/DiscTestManager";

interface DiscPageProps {
    params: Promise<{ locale: string }>;
}

export default async function DiscPage({ params }: DiscPageProps) {
    const { locale } = await params;
    return <DiscTestManager locale={locale} />;
}

import StickyHeroScroll from "../../components/home/StickyHeroScroll";
import CloudRevealSection from "../../components/home/CloudRevealSection";
import AboutUsScrollSection from "../../components/home/AboutUsScrollSection";
import FeatureDashboardScroll from "../../components/home/FeatureDashboardScroll";
import Footer from "../../components/layout/footer";

export default function Home() {

    return (
        <div className="flex flex-col w-full bg-[#f8f8f8] text-black">
            <StickyHeroScroll />
            <div className="relative z-20 w-full bg-[#fff0f4] rounded-t-[4rem] sm:rounded-t-[60px] md:rounded-t-[70px] shadow-[0_-15px_50px_rgba(0,0,0,0.06)]">
                <CloudRevealSection />
                <AboutUsScrollSection />
            </div>
            <FeatureDashboardScroll />
            <Footer />
        </div>
    );
}

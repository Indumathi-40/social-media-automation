import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Page() {
    return (
        <div className="min-h-screen bg-background font-sans">
            <Navbar />
            <main>
                <Hero />
                <Stats />
                <Features />
                <Testimonials />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}
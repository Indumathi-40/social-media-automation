import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export function CTASection() {
    return (
        <section className="py-20 px-4">
            <div className="container mx-auto">
                <div className="bg-primary rounded-3xl p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden">
                    {/* Background decoration */}
                    <Send className="absolute top-10 right-10 h-64 w-64 opacity-10 -rotate-12" />

                    <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                            Grow your social presence with confidence
                        </h2>

                        <Button size="lg" variant="secondary" className="h-12 px-8 text-lg font-semibold">
                            Get started for free
                        </Button>

                        <p className="text-primary-foreground/80 text-sm">
                            No credit card needed. Free 14-day trial.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

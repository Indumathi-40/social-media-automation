import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Hero() {
    return (
        <section className="py-20 md:py-32 px-4 text-center bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto max-w-4xl space-y-8">
                <div className="flex justify-center">
                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider font-semibold">
                        New: AI Post Generation
                    </Badge>
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                    Master Your Social <br className="hidden md:block" />
                    Presence <span className="text-primary">effortlessly.</span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    The all-in-one toolkit to schedule, engage, and analyze your social media.
                    Grow your brand with tools designed for creators and teams.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto pt-4">
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        className="h-12 bg-background"
                    />
                    <Button size="lg" className="h-12 px-8 w-full sm:w-auto font-semibold">
                        Start Your Free Trial
                    </Button>
                </div>

                {/* Minimalist icons/placeholders to mimic the floating elements in the design */}
                <div className="grid grid-cols-6 gap-8 opacity-20 pt-12 max-w-2xl mx-auto grayscale hover:grayscale-0 transition-all duration-500">
                    {/* Placeholders for platform icons */}
                    <div className="h-12 w-12 bg-muted rounded-xl mx-auto animate-pulse" />
                    <div className="h-12 w-12 bg-muted rounded-xl mx-auto animate-pulse delay-75" />
                    <div className="h-12 w-12 bg-muted rounded-xl mx-auto animate-pulse delay-150" />
                    <div className="h-12 w-12 bg-muted rounded-xl mx-auto animate-pulse delay-200" />
                    <div className="h-12 w-12 bg-muted rounded-xl mx-auto animate-pulse delay-300" />
                    <div className="h-12 w-12 bg-muted rounded-xl mx-auto animate-pulse delay-500" />
                </div>
            </div>
        </section>
    );
}

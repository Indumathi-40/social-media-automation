import { SocialFlowLogo } from "@/components/landing/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface AuthLayoutProps {
    children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Brandy/Testimonial */}
            <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12 text-primary-foreground">

                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8">
                        <SocialFlowLogo className="h-8 w-8 text-white" />
                    </div>

                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Join 50,000+ brands growing with SocialFlow.
                    </h1>
                    <p className="text-xl text-primary-foreground/80 max-w-lg">
                        Everything you need to schedule, engage, and analyze your social media presence in one intuitive platform.
                    </p>
                </div>

                <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                    <div className="flex gap-1 mb-4 text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-current" />
                        ))}
                    </div>
                    <p className="text-lg italic mb-6 leading-relaxed">
                        "SocialFlow has completely transformed how our agency handles client socials. It's the cleanest tool we've ever used."
                    </p>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-white/20">
                            <AvatarImage src="/placeholder-avatar-1.jpg" />
                            <AvatarFallback>SJ</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold">Sarah Jenkins</p>
                            <p className="text-sm text-primary-foreground/70">Creative Director @ FlowAgency</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col p-8 md:p-12 relative bg-background">
                <div className="absolute top-8 right-8 flex items-center gap-2 font-bold text-xl lg:hidden">
                    <SocialFlowLogo className="h-8 w-8 text-primary" />
                    <span>SocialFlow</span>
                </div>

                <div className="absolute top-8 right-8 hidden lg:flex items-center gap-2 font-bold text-xl">
                    <SocialFlowLogo className="h-8 w-8 text-primary" />
                    <span>SocialFlow</span>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-[400px]">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

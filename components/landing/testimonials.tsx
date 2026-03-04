import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Testimonials() {
    const testimonials = [
        {
            name: "Sarah V-Codes",
            handle: "@sarah_vcodes",
            avatar: "/placeholder-avatar-1.jpg",
            text: "The autolist feature has saved me hours a week! The scheduling is flawless and the UI is so beautiful."
        },
        {
            name: "James Dev",
            handle: "@james_dev",
            avatar: "/placeholder-avatar-2.jpg",
            text: "The engagement dashboard is a game changer. I can respond to all my LinkedIn and X replies from one place."
        },
        {
            name: "Kira Design",
            handle: "@kira_designs",
            avatar: "/placeholder-avatar-3.jpg",
            text: "I've tried every tool out there, but this is the first one that actually helps me understand my growth trends."
        }
    ];

    return (
        <section className="py-20 bg-muted/20">
            <div className="container mx-auto px-4">
                <div className="mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                        Grow from zero to <span className="text-primary italic">one million</span>
                    </h2>
                    <p className="text-muted-foreground">
                        Join thousands of creators who've built their dream audience with SocialFlow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t, i) => (
                        <Card key={i} className="bg-background border-none shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                                        {/* Fallback for now since we don't have real images */}
                                        <div className="h-full w-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                            {t.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{t.name}</p>
                                        <p className="text-xs text-muted-foreground">{t.handle}</p>
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    "{t.text}"
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

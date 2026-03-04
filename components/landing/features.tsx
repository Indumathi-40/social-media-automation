import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, MessageSquare, ChartBar } from "lucide-react";

export function Features() {
    const features = [
        {
            icon: <Calendar className="h-6 w-6 text-primary" />,
            title: "Automated Scheduling",
            description: "Plan and schedule your content across all platforms from a single intuitive dashboard. Set it and forget it."
        },
        {
            icon: <MessageSquare className="h-6 w-6 text-primary" />,
            title: "Smart Engagement",
            description: "Never miss a comment. View and respond to interactions across all channels in one unified inbox with AI assistance."
        },
        {
            icon: <ChartBar className="h-6 w-6 text-primary" />,
            title: "In-depth Analytics",
            description: "Measure what matters. Get beautiful, actionable reports on your growth, reach, and best times to post."
        }
    ];

    return (
        <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need to grow</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Focus on creating content while we handle the heavy lifting of scheduling and performance tracking.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-muted/40">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    {feature.icon}
                                </div>
                                <CardTitle className="text-xl">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base leading-relaxed">
                                    {feature.description}
                                </CardDescription>
                                <div className="mt-6 font-medium text-primary cursor-pointer hover:underline flex items-center gap-1">
                                    Learn more <span>+</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

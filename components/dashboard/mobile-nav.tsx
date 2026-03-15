"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Menu, 
    LayoutGrid, 
    Grid, 
    Instagram, 
    Linkedin, 
    Settings, 
    SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
    Sheet, 
    SheetContent, 
    SheetTrigger,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet";
import { SocialFlowLogo } from "@/components/landing/logo";
import { cn } from "@/lib/utils";

export function MobileNav() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const menuLinks = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    ];

    const channelLinks = [
        { href: "/dashboard/channels", label: "All Channels", icon: Grid },
        { href: "/dashboard/instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
        { href: "/dashboard/linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
    ];

    const bottomLinks = [
        { href: "#", label: "Manage Channels", icon: SlidersHorizontal },
        { href: "#", label: "Settings", icon: Settings },
    ];

    const getLinkClass = (path: string) => {
        const isActive = pathname === path;
        return cn(
            "flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md transition-colors",
            isActive
                ? "bg-purple-50 text-purple-700"
                : "text-gray-700 hover:bg-purple-50 hover:text-purple-600"
        );
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>
                        <Link 
                            href="/dashboard" 
                            className="flex items-center gap-2 font-bold text-lg"
                            onClick={() => setOpen(false)}
                        >
                            <SocialFlowLogo className="h-6 w-6" />
                            <span>SocialFlow</span>
                        </Link>
                    </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-[calc(100vh-65px)] overflow-y-auto p-4 space-y-6">
                    {/* Menu Nav */}
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-3 uppercase tracking-wider">Menu</h3>
                        <div className="space-y-1">
                            {menuLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={getLinkClass(link.href)}
                                    onClick={() => setOpen(false)}
                                >
                                    <link.icon className="h-5 w-5" />
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Channels Nav */}
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-3 uppercase tracking-wider">Channels</h3>
                        <div className="space-y-1">
                            {channelLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={getLinkClass(link.href)}
                                    onClick={() => setOpen(false)}
                                >
                                    <link.icon className={cn("h-5 w-5", link.color)} />
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Nav */}
                    <div className="mt-auto pt-6 border-t pb-4">
                        <div className="space-y-1">
                            {bottomLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="flex items-center gap-3 px-3 py-2 text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-md transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    <link.icon className="h-5 w-5" />
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

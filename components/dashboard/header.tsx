"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SocialFlowLogo } from "@/components/landing/logo";
import { UserButton } from "@clerk/nextjs";
import { Plus, Sprout, HelpCircle, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
    const pathname = usePathname();
    return (
        <header className="h-16 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-50">
            <div className="flex items-center gap-8">
                {/* Logo Section */}
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
                    <SocialFlowLogo className="h-6 w-6" />
                    <span>SocialFlow</span>
                </Link>

                {/* Main Nav Links */}
                <nav className="hidden md:flex items-center">
                    <Link
                        href="/dashboard/create"
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors rounded-sm",
                            pathname === "/dashboard/create"
                                ? "bg-purple-50 text-purple-700"
                                : "text-black hover:text-purple-600"
                        )}
                    >
                        Create
                    </Link>
                    <Link
                        href="/dashboard"
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors rounded-sm",
                            pathname === "/dashboard"
                                ? "bg-purple-50 text-purple-700"
                                : "text-black hover:text-purple-600"
                        )}
                    >
                        Publish
                    </Link>
                    <Link
                        href="/dashboard/community"
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors rounded-sm flex items-center gap-2",
                            pathname === "/dashboard/community"
                                ? "bg-purple-50 text-purple-700"
                                : "text-black hover:text-purple-600"
                        )}
                    >
                        Community
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">New</span>
                    </Link>
                    <Link
                        href="/dashboard/start-page"
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors rounded-sm",
                            pathname === "/dashboard/start-page"
                                ? "bg-purple-50 text-purple-700"
                                : "text-black hover:text-purple-600"
                        )}
                    >
                        Start Page
                    </Link>
                </nav>
            </div>

            <div className="flex items-center gap-4">


                <div className="flex items-center gap-2 text-muted-foreground">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Sprout className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <HelpCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Gift className="h-4 w-4" />
                    </Button>
                </div>

                <div className="h-8 w-8 border-l pl-4 ml-2 flex items-center">
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </header>
    );
}

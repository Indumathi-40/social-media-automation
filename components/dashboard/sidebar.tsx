"use client";

import { useEffect, useState } from "react";


import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Grid, Instagram, Linkedin, Settings, SlidersHorizontal, ListTodo, Send, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";

// Convex & Clerk Integrations
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function DashboardSidebar() {
    const pathname = usePathname();
    const { user } = useUser();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Mutations to sync data to Convex
    // Mutations removed to prevent overwriting correct data with stale cache


    const getLinkClass = (path: string) => {
        if (!isMounted) return cn("flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md transition-colors text-black hover:bg-purple-50 hover:text-purple-600");

        const isActive = pathname === path;
        return cn(
            "flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md transition-colors",
            isActive
                ? "bg-purple-50 text-purple-700 font-semibold"
                : "text-black hover:bg-purple-50 hover:text-purple-600"
        );
    };

    // Auto-sync removed. We rely on the connection page to handle this securely.



    return (
        <div className="w-64 border-r bg-white flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
            <div className="p-4 space-y-6">

                {/* Menu Section */}
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2 uppercase tracking-wider">Menu</h3>
                    <div className="space-y-1">
                        <Link
                            href="/dashboard"
                            className={getLinkClass("/dashboard")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Dashboard
                        </Link>
                    </div>
                </div>


                {/* Channels Section */}
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2 uppercase tracking-wider">Channels</h3>
                    <div className="space-y-1">
                        <Link
                            href="/dashboard/channels"
                            className={getLinkClass("/dashboard/channels")}
                        >
                            <Grid className="h-4 w-4" />
                            All Channels
                        </Link>

                        <Link
                            href="/dashboard/instagram"
                            className={getLinkClass("/dashboard/instagram")}
                        >
                            <Instagram className={cn("h-4 w-4", isMounted && pathname === "/dashboard/instagram" ? "text-purple-700" : "text-pink-500")} />
                            Instagram
                        </Link>

                        {/* LinkedIn */}
                        <Link
                            href="/dashboard/linkedin"
                            className={getLinkClass("/dashboard/linkedin")}
                        >
                            <Linkedin className={cn("h-4 w-4", isMounted && pathname === "/dashboard/linkedin" ? "text-purple-700" : "text-blue-700")} />
                            LinkedIn
                        </Link>

                    </div>
                </div>

            </div>

            <div className="mt-auto p-4 border-t">
                <div className="space-y-1">
                    <Link
                        href="#"
                        className="flex items-center gap-3 px-2 py-2 text-sm font-medium text-black hover:bg-purple-50 hover:text-purple-600 rounded-md transition-colors"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Manage Channels
                    </Link>
                    <Link
                        href="#"
                        className="flex items-center gap-3 px-2 py-2 text-sm font-medium text-black hover:bg-purple-50 hover:text-purple-600 rounded-md transition-colors"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </div>
            </div>
        </div>
    );
}

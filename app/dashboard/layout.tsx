import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen bg-muted/20 flex flex-col overflow-hidden">
            <DashboardHeader />
            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:block">
                    <DashboardSidebar />
                </aside>
                <main className="flex-1 overflow-auto p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

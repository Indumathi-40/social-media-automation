import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

export function PerformanceChart() {
    // Simulating the curve from the image
    const pathData = "M0,250 C50,200 100,150 150,150 S250,250 300,100 S400,0 500,50 S600,100 800,120";

    return (
        <Card className="shadow-sm border-0 bg-white h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base font-bold text-gray-800">Performance Overview</CardTitle>
                <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-md text-gray-600 hover:bg-gray-50">
                    Total Engagement
                    <ChevronDown className="h-3 w-3" />
                </button>
            </CardHeader>
            <CardContent>
                <div className="relative h-[250px] w-full mt-4">
                    {/* Y-Axis Labels */}
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-400 font-medium">
                        <span>6.5k</span>
                        <span>6k</span>
                        <span>5.5k</span>
                        <span>5k</span>
                        <span>4.5k</span>
                        <span>4k</span>
                        <span>3.5k</span>
                        <span>3k</span>
                    </div>

                    {/* Chart Area */}
                    <div className="absolute left-8 right-0 top-0 bottom-6">
                        {/* Horizontal Grid Lines */}
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="absolute w-full border-t border-dashed border-gray-100" style={{ top: `${i * 14.2}%` }} />
                        ))}

                        {/* SVG Line Chart */}
                        <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none" className="overflow-visible">
                            <defs>
                                <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M0,280 C100,200 150,180 250,220 S350,150 450,160 S550,50 650,60 S750,80 800,90"
                                fill="none"
                                stroke="#064e3b" // Dark green
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            <path
                                d="M0,280 C100,200 150,180 250,220 S350,150 450,160 S550,50 650,60 S750,80 800,90 L800,300 L0,300 Z"
                                fill="url(#fillGradient)"
                                stroke="none"
                            />
                            {/* Data Points */}
                            <circle cx="0" cy="280" r="4" fill="#064e3b" stroke="white" strokeWidth="2" />
                            <circle cx="150" cy="190" r="4" fill="#064e3b" stroke="white" strokeWidth="2" />
                            <circle cx="280" cy="210" r="4" fill="#064e3b" stroke="white" strokeWidth="2" />
                            <circle cx="400" cy="130" r="4" fill="#064e3b" stroke="white" strokeWidth="2" />
                            <circle cx="650" cy="60" r="4" fill="#064e3b" stroke="white" strokeWidth="2" />
                            <circle cx="800" cy="90" r="4" fill="#064e3b" stroke="white" strokeWidth="2" />
                        </svg>
                    </div>

                    {/* X-Axis Labels */}
                    <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-gray-400 font-medium px-4">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

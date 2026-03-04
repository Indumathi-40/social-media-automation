import { SocialFlowLogo } from "@/components/landing/logo";
import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-[#0b0c15] text-white py-16 border-t border-white/10">  {/* Using a dark hex for valid dark footer look regardless of theme */}
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 font-bold text-xl">
                            <SocialFlowLogo className="h-8 w-8" />
                            <span>SocialFlow</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            Empowering brands and creators to build meaningful connections through smarter social media management.
                        </p>
                        <div className="flex gap-4">
                            {/* Social Icons Placeholders */}
                            <div className="h-8 w-8 rounded bg-white/10" />
                            <div className="h-8 w-8 rounded bg-white/10" />
                            <div className="h-8 w-8 rounded bg-white/10" />
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="#" className="hover:text-white transition-colors">Publishing</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Analytics</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Engagement</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Start Page</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Resources</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Library</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Partners</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Free Tools</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Company</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Press</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                </div>

                <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
                    <p>© 2024 SocialFlow Inc. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link href="#" className="hover:text-white">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white">Terms of Service</Link>
                        <Link href="#" className="hover:text-white">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

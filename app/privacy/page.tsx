import React from 'react';
import Link from 'next/link';
import { Shield, Lock, EyeOff, Share2, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | SocialFlow',
  description: 'Learn how SocialFlow handles your data and protects your privacy.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
        {/* Header Decor */}
        <div className="h-2 bg-gradient-to-r from-purple-600 to-blue-600"></div>
        
        <div className="p-8 sm:p-12">
          {/* Back Button */}
          <Link 
            href="/" 
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-purple-600 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
          </div>

          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            Your privacy is our priority. This policy explains how SocialFlow collects, uses, and protects your information when you use our social media automation services.
          </p>

          <div className="space-y-12">
            {/* Section 1 */}
            <section className="relative pl-8 border-l-2 border-slate-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-600 border-4 border-white shadow-sm"></div>
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider text-sm">
                  Instagram Integration
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                SocialFlow allows you to connect your Instagram accounts to facilitate social media automation, including scheduling and publishing posts. We use the official Instagram Graph API to perform these actions securely.
              </p>
            </section>

            {/* Section 2 */}
            <section className="relative pl-8 border-l-2 border-slate-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider text-sm">
                  Password Security
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong className="text-slate-900 font-semibold">We never store your Instagram passwords.</strong> Authentication is handled directly through Facebook/Instagram's secure OAuth flow. We only receive a secure access token to interact with the API on your behalf.
              </p>
            </section>

            {/* Section 3 */}
            <section className="relative pl-8 border-l-2 border-slate-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
              <div className="flex items-center gap-2 mb-4">
                <EyeOff className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider text-sm">
                  Data Privacy
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                We believe your data belongs to you. SocialFlow <strong className="text-slate-900 font-semibold">does not sell your personal data</strong> to third parties. Your account information and content are used exclusively to provide the services you have requested.
              </p>
            </section>

            {/* Section 4 */}
            <section className="relative pl-8 border-l-2 border-slate-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-4 border-white shadow-sm"></div>
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider text-sm mb-4">
                Permissions & Usage
              </h2>
              <p className="text-slate-600 leading-relaxed">
                By connecting your account, you grant SocialFlow permission to publish content, manage comments, and view insights as necessary for the platform to function. You can revoke these permissions at any time through your Instagram settings or by disconnecting your account in our dashboard.
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-400">
              Last Updated: March 2024 • Built with transparency by the SocialFlow Team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

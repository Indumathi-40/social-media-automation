import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Share2 } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
            <ShieldCheck className="w-3 h-3" />
            Trusted & Secure
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Your privacy is our priority. Learn how we handle your data with transparency and security.
          </p>
        </div>

        <div className="mt-12 space-y-10 text-gray-600 leading-relaxed">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Share2 className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Instagram Integration</h2>
            </div>
            <p>
              Our application allows you to connect your official Instagram account to enable social media automation. This integration is designed to help you <strong>schedule and publish posts</strong> directly from our dashboard, streamlining your content strategy.
            </p>
          </section>

          <section className="space-y-4 font-medium">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-center gap-2 text-blue-800">
                  <Lock className="w-4 h-4" />
                  <span className="font-bold">Password Security</span>
                </div>
                <p className="text-sm text-blue-700 leading-snug">
                  We <strong>never store</strong> your Instagram password. Authentication is handled directly by Meta/Instagram through secure OAuth protocols.
                </p>
              </div>

              <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <EyeOff className="w-4 h-4" />
                  <span className="font-bold">Data Privacy</span>
                </div>
                <p className="text-sm text-emerald-700 leading-snug">
                  We <strong>do not sell</strong> your user data. Your information is used strictly to provide the services you requested within the app.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">How We Use the API</h2>
            <p>
              We only use the official Instagram Business API to publish content on your behalf. We will <strong>never post</strong> anything without your explicit permission or action (such as scheduling or clicking "Publish").
            </p>
            <p className="text-sm text-gray-500 italic">
              By using our service, you agree to our terms and the way we interact with the Instagram platform to provide automation features.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} SocialFlow. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

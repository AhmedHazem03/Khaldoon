"use client";

import GoogleSignInButton from "@/components/profile/GoogleSignInButton";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm text-center space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">مطعم خلدون</h1>
          <p className="text-sm text-gray-500 mt-1">سجل دخولك للمتابعة</p>
        </div>

        <GoogleSignInButton className="w-full min-h-[52px] flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl shadow-sm text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60" />

        <p className="text-xs text-gray-400">
          بالتسجيل، توافق على استخدام بياناتك لإدارة حسابك وطلباتك
        </p>
      </div>
    </div>
  );
}

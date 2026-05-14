"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      setError(error?.message || "فشل تسجيل الدخول. تأكد من البيانات وحاول مرة أخرى.");
      setIsLoading(false);
      return;
    }

    if (data.user.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setError("هذا الحساب ليس حساب مدير. الرجاء استخدام بيانات admin فقط.");
      setIsLoading(false);
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">دخول المدير</h1>
          <p className="mt-2 text-sm text-gray-500">
            أدخل بريد admin وكلمة المرور للدخول إلى لوحة التحكم.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="admin@example.com"
              className="mt-2 w-full rounded-2xl border border-gray-300 bg-slate-50 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              placeholder="أدخل كلمة المرور"
              className="mt-2 w-full rounded-2xl border border-gray-300 bg-slate-50 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-white transition hover:bg-[#172446] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "جاري تسجيل الدخول..." : "دخول admin"}
          </button>
        </form>
      </div>
    </div>
  );
}

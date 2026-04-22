"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createBrowserClient } from "@/lib/supabase";
import { mergeGuestOrders, registerUser } from "@/app/login/actions";

// ─── Schema ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "مطلوب")
    .refine(
      (v) => v.includes("@") || /^01[0125][0-9]{8}$/.test(v),
      "رقم الهاتف غير صحيح (مثال: 01012345678)"
    ),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "الاسم مطلوب"),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

// ─── Component ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  // After successful auth, merge guest orders then redirect
  async function afterAuth(userId: string, appMetadata?: Record<string, unknown>) {
    try {
      const guestToken =
        typeof window !== "undefined"
          ? sessionStorage.getItem("guest_token")
          : null;

      if (guestToken) {
        await mergeGuestOrders(userId, guestToken);
        sessionStorage.removeItem("guest_token");
      }
    } catch {
      // merge failure is non-critical — continue to redirect
    }

    if (appMetadata?.role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/profile");
    }
  }

  async function onLogin(data: LoginData) {
    setLoading(true);
    setErrorMsg(null);

    const supabase = createBrowserClient();
    // Accept raw email (e.g. admin@khaldoun.com) or phone number
    const email = data.phone.includes("@")
      ? data.phone
      : `${data.phone}@khaldoun.com`;

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: data.password,
    });

    setLoading(false);

    if (error || !authData.user) {
      setErrorMsg("رقم الهاتف أو كلمة المرور غير صحيحة");
      return;
    }

    await afterAuth(authData.user.id, authData.user.app_metadata);
  }

  async function onRegister(data: RegisterData) {
    setLoading(true);
    setErrorMsg(null);

    // Create user via admin API (server action) — no confirmation email sent
    const result = await registerUser(data.phone, data.password, data.name);

    if ("error" in result) {
      setLoading(false);
      setErrorMsg(result.error);
      return;
    }

    // Immediately sign in after successful creation
    const supabase = createBrowserClient();
    const email = `${data.phone}@khaldoun.com`;
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: data.password,
    });

    setLoading(false);

    if (signInError || !authData.user) {
      setErrorMsg("تم إنشاء الحساب، حاول تسجيل الدخول");
      return;
    }

    await afterAuth(authData.user.id, authData.user.app_metadata);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">مطعم خلدون</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
            }}
            className={`flex-1 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500"
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => {
              setMode("register");
              setErrorMsg(null);
            }}
            className={`flex-1 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
              mode === "register"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500"
            }`}
          >
            حساب جديد
          </button>
        </div>

        {/* ── Login Form ── */}
        {mode === "login" && (
          <form
            onSubmit={loginForm.handleSubmit(onLogin)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                رقم الهاتف
              </label>
              <input
                {...loginForm.register("phone")}
                placeholder="01012345678"
                dir="ltr"
                inputMode="tel"
                className="w-full min-h-[44px] px-4 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-accent"
              />
              {loginForm.formState.errors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {loginForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                كلمة المرور
              </label>
              <input
                {...loginForm.register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full min-h-[44px] px-4 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-accent"
              />
              {loginForm.formState.errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {errorMsg && (
              <p className="text-red-500 text-sm text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-primary text-white rounded-xl font-bold text-base disabled:opacity-60"
            >
              {loading ? "جاري التحقق..." : "دخول"}
            </button>
          </form>
        )}

        {/* ── Register Form ── */}
        {mode === "register" && (
          <form
            onSubmit={registerForm.handleSubmit(onRegister)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input
                {...registerForm.register("name")}
                placeholder="اسمك الكامل"
                className="w-full min-h-[44px] px-4 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-accent"
              />
              {registerForm.formState.errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input
                {...registerForm.register("phone")}
                placeholder="01012345678"
                dir="ltr"
                inputMode="tel"
                className="w-full min-h-[44px] px-4 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-accent"
              />
              {registerForm.formState.errors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {registerForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                كلمة المرور <span className="text-red-500">*</span>
              </label>
              <input
                {...registerForm.register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full min-h-[44px] px-4 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-accent"
              />
              {registerForm.formState.errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {errorMsg && (
              <p className="text-red-500 text-sm text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-accent text-white rounded-xl font-bold text-base disabled:opacity-60"
            >
              {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase-server";

const NAV_LINKS = [
  { href: "/admin/dashboard", label: "الرئيسية" },
  { href: "/admin/orders", label: "الطلبات" },
  { href: "/admin/menu", label: "المنيو" },
  { href: "/admin/offers", label: "العروض" },
  { href: "/admin/zones", label: "مناطق التوصيل" },
  { href: "/admin/customers", label: "العملاء" },
  { href: "/admin/settings", label: "الإعدادات" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Secondary auth check — middleware is the primary guard.
  // This ensures Server Components also verify admin role.
  const sessionClient = await createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#FDF5EC]">
      {/* Admin top nav */}
      <nav className="sticky top-0 z-50 bg-[#0F293E] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
            <span className="text-xs font-bold text-[#E4570F] ml-3 flex-shrink-0">
              Admin
            </span>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex-shrink-0 px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors min-h-[44px] flex items-center"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

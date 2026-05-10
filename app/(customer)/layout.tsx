import Header from "@/components/layout/Header";
import FloatingWhatsapp from "@/components/ui/FloatingWhatsapp";
import GuestTokenInit from "@/components/ui/GuestTokenInit";
import { getSettings } from "@/lib/settings";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <>
      <GuestTokenInit />
      <Header />
      {children}
      <FloatingWhatsapp url={settings.whatsapp_social_url} />
    </>
  );
}

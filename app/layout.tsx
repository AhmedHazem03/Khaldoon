import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "مطعم خلدون",
    template: "%s | مطعم خلدون",
  },
  description: "اطلب أشهى المأكولات من مطعم خلدون — توصيل سريع ونكهات شامية أصيلة",
  openGraph: {
    title: "مطعم خلدون",
    description: "اطلب أشهى المأكولات من مطعم خلدون — توصيل سريع ونكهات شامية أصيلة",
    siteName: "مطعم خلدون",
    locale: "ar_EG",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "مطعم خلدون — أصل السوري هون",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "مطعم خلدون",
    description: "اطلب أشهى المأكولات من مطعم خلدون — توصيل سريع ونكهات شامية أصيلة",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-sans bg-background text-text antialiased">
        {children}
      </body>
    </html>
  );
}

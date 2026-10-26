import type { Metadata, Viewport } from "next";
import { shopConfig } from "@/config/shop";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "./globals.css";
import { appUrl } from "@/lib/app-url";


export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: shopConfig.name, template: `%s | ${shopConfig.name}` },
  description: shopConfig.tagline,
  openGraph: { type: "website", locale: "fr_CI", siteName: shopConfig.name },
  icons: { icon: shopConfig.logo },
};

export const viewport: Viewport = { themeColor: shopConfig.colors.primary, width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

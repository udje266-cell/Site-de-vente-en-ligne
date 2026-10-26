import type { Metadata, Viewport } from "next";
import { shopConfig } from "@/config/shop";
import "./globals.css";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
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

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-stone-50">{children}</div>;
}

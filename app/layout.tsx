import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fridge AI",
  description:
    "Scan receipts, check cooked dishes, and manage your fridge — powered by AI.",
};

export const viewport: Viewport = {
  themeColor: "#e6f4f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh text-ink antialiased">{children}</body>
    </html>
  );
}

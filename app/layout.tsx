import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lancet General Hospital - Queue Management",
  description: "Smart queue management system for Lancet General Hospital, Addis Ababa. Clinical triage with Amharic, Afaan Oromoo, and English support.",
  keywords: ["Lancet", "hospital", "queue", "triage", "Ethiopia", "Addis Ababa", "healthcare"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

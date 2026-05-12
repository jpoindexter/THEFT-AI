import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import ThemeBoot from "@/components/theme-boot";
import ToastHost from "@/components/toast-host";

export const metadata: Metadata = {
  title: "THEFT — Run your company with agents",
  description:
    "AI workspace platform. Onboarding, departments, agents, tasks — one place.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink font-mono">
        <ThemeBoot />
        {children}
        <ToastHost />
      </body>
    </html>
  );
}

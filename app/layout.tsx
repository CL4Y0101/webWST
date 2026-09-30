import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./dashboard-theme.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "TunaGuard — Monitoring Rantai Dingin",
  description: "Dashboard pemantauan suhu dan kelembapan ruang penyimpanan tuna berbasis IoT.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${dmSans.variable} ${spaceGrotesk.variable}`}>{children}</body>
    </html>
  );
}

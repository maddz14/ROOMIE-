import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ROOMIE — Peminjaman Ruang & Lapangan Kampus",
  description:
    "Sistem Manajemen Peminjaman Ruangan dan Lapangan Kampus. Pengajuan digital, persetujuan dua tahap, check-in/out, dan laporan.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}

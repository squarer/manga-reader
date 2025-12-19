import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { SnowEffect } from "@/components/SnowEffect";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manga Reader - 漫畫閱讀器",
  description: "線上漫畫閱讀器，支援日本漫畫、港台漫畫、歐美漫畫、韓國漫畫",
  keywords: ["漫畫", "manga", "comic", "閱讀器", "reader"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SnowEffect />
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

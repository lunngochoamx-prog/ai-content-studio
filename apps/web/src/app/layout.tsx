import type { Metadata } from "next";
import { Be_Vietnam_Pro, Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "AI Content Studio — Ứng Dụng Viết Content Đa Ngành Nghề & Bộ Não Thứ 2",
  description:
    "Nền tảng viết và chấm điểm 65 tiêu chí SEO Google & GEO AI Overviews, tích hợp 22 công thức đa nền tảng (Facebook, TikTok, Website), Bộ não thứ 2 tự phân loại ngành nghề, học phong cách cá nhân và kết nối 9Router / Ollama / Cloud API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${beVietnam.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}

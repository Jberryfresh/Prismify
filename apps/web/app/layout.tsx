import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Prismify - AI-Powered SEO Analysis Platform",
  description: "Boost your search rankings with AI-powered SEO audits. Get comprehensive insights across meta tags, content, technical SEO, and more.",
  keywords: ["SEO", "SEO audit", "SEO analysis", "AI SEO", "search engine optimization", "website optimization"],
  authors: [{ name: "Prismify" }],
  openGraph: {
    title: "Prismify - AI-Powered SEO Analysis",
    description: "Boost your search rankings with comprehensive AI-powered SEO audits",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

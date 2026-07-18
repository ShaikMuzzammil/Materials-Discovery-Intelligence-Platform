import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MatDiscoverAI - AI-Powered Material Discovery Platform",
  description: "Advanced NLP/LLM-based material discovery framework for intelligent research, prediction, and knowledge extraction. Discover next-generation materials with AI.",
  keywords: ["MatDiscoverAI", "Material Discovery", "NLP", "LLM", "AI", "Materials Science", "Research", "Machine Learning", "Knowledge Graph"],
  authors: [{ name: "MatDiscoverAI Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "MatDiscoverAI - AI-Powered Material Discovery Platform",
    description: "Discover next-generation materials with advanced NLP/LLM intelligence",
    siteName: "MatDiscoverAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MatDiscoverAI - Material Discovery Platform",
    description: "AI-powered material discovery and research platform",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

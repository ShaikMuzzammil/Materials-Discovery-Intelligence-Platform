import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
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
  title: "MatSciML Discovery — NLP + LLM to New Materials Prediction Platform",
  description:
    "Capstone 24041_103 · Research papers → MatSciBERT → XGBoost → new material discovery. 20 papers, 295 property sentences, 4,601 clean samples, 63 selected features, 5 models compared, 111 discovery candidates.",
  keywords: [
    "materials discovery",
    "NLP",
    "LLM",
    "MatSciBERT",
    "XGBoost",
    "band gap",
    "Matbench",
    "machine learning",
  ],
  authors: [{ name: "Capstone 24041_103" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "MatSciML Discovery Platform",
    description:
      "Research papers → MatSciBERT → XGBoost → new material discovery. Verified zero-error pipeline run.",
    siteName: "MatSciML Discovery",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

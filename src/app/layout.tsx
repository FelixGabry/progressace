import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ProgressAce — Turn goals into measurable progress",
    template: "%s | ProgressAce",
  },
  description:
    "ProgressAce helps you achieve any goal with visual milestones and a progress bar. Track every goal. Measure every step.",
  openGraph: {
    title: "ProgressAce — Turn goals into measurable progress",
    description:
      "Break goals into steps, track your progress bar, and stay motivated with every milestone.",
    siteName: "ProgressAce",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

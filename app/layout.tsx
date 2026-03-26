import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pilot Note — Your Complete CPL Study & Exam Platform",
  description: "India's premier CPL study platform — DGCA RTR practice, comprehensive guides, All India mock exams (Pariksha), and Pilot Aptitude tests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-color-text antialiased">
        {children}
      </body>
    </html>
  );
}

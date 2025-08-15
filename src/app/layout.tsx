/**
 * Root Layout Component
 * 
 * The main layout wrapper for the entire Next.js application providing:
 * - Global font configuration with Geist and Geist Mono fonts
 * - Language context for bilingual support (English/Spanish)
 * - Authentication provider for session management
 * - Global CSS styles and Tailwind CSS configuration
 * - Proper HTML document structure with semantic markup
 * - Font optimization with display swap for performance
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers";
import { LanguageProvider } from "@/contexts/LanguageContext";

const geist = Geist({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Performance Management System",
  description: "Simple OKR and competency evaluation system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

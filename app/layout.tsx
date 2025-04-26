import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { config } from "./utils/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SPŠE Jecná - Kiosek",
  description: "Kiosek pro SPŠE Jecná projekty",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: `${config.apiUrl}/uploads/SPSE-Jecna_Logo.svg`, type: 'image/svg+xml' }
    ]
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="antialiased min-h-full flex flex-col bg-background text-foreground">
        <main className="flex-grow flex flex-col">{children}</main>
      </body>
    </html>
  );
}

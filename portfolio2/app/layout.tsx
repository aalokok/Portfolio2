import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter-sans",
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aalok Sud",
  description: "Designer and Creative Technologist",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Aalok Sud",
    description: "Designer and Creative Technologist",
    images: [
      { url: "/favicon.ico" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full bg-[#f5f5f5] antialiased`}
    >
      <body className="min-h-full bg-[#f5f5f5] text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

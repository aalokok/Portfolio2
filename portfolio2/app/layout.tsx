import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const areal = localFont({
  variable: "--font-areal-face",
  src: [
    { path: "./fonts/ABCAreal-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ABCAreal-RegularItalic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/ABCAreal-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ABCAreal-MediumItalic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/ABCAreal-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/ABCAreal-BoldItalic.woff2", weight: "700", style: "italic" },
  ],
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
      className={`${areal.variable} h-full bg-[#f5f5f5] antialiased`}
    >
      <body className="min-h-full bg-[#f5f5f5] text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

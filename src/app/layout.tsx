import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { conference } from "@/content/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const description = `${conference.name} brings together college students and guest speakers working on AI policy. ${conference.dates} in ${conference.location}.`;

export const metadata: Metadata = {
  title: `${conference.name} — ${conference.dates}`,
  description,
  openGraph: {
    title: conference.name,
    description,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

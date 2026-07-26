import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { conference } from "@/content/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** Display face for the wordmark, nav, and section headings. */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
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
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} h-full antialiased`}
    >
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

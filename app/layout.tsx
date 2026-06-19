import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { IBM_Plex_Mono, IBM_Plex_Sans, Oswald } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Factorio Library",
  description: "A public library for Factorio blueprint strings.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} ${oswald.variable} h-full`}>
      <body className="min-h-full bg-[#0d0e0a] text-stone-100 antialiased">
        <ClerkProvider>
          <div className="relative flex min-h-screen flex-col overflow-x-hidden">
            <SiteHeader />
            <div className="relative z-10 flex flex-1 flex-col">{children}</div>
            <SiteFooter />
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}

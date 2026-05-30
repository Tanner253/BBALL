import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ContractBar } from "@/components/site/ContractBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "$BBALL — A beachball cannot be held underwater forever",
  description:
    "The official meme depot and lore for the $BBALL Solana memecoin community. Grab the ball, hold it under, then let it fly.",
  openGraph: {
    title: "$BBALL — A beachball cannot be held underwater forever",
    description:
      "Meme depot and lore for the $BBALL community.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@bballonpf",
    creator: "@bballonpf",
    title: "$BBALL",
    description:
      "Meme depot and lore for the $BBALL community.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffd6a0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col selection:bg-[var(--ball-yellow)]">
        <Navbar />
        <ContractBar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

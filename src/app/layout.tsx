import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import VantaBackground from "@/components/VantaBackground";
import SiteLoader from "@/components/SiteLoader";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "$COOKED",
  description:
    "$COOKED — the algorithm is lying. A meme coin for everyone who has ever been cooked by the market. Stay cooked.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} antialiased text-lg`}>
        <VantaBackground />
        <div className="relative z-10">{children}</div>
        <SiteLoader />
      </body>
    </html>
  );
}

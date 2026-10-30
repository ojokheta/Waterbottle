import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { ShapePhysics } from "@/components/shape-physics";
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
        {/* Falling figures painted behind every section of the page. */}
        <div className="fixed inset-0 z-0" aria-hidden="true">
          <ShapePhysics height="100svh" />
          <div className="absolute inset-0 bg-black/45" />
        </div>
        <div className="relative z-10">{children}</div>
        <SiteLoader />
      </body>
    </html>
  );
}

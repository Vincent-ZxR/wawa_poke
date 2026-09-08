import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const romanticFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-romantic",
});

export const metadata: Metadata = {
  title: "wawawawa",
  description: "Mini aventure romantique inspirée d'un très petit Pokémon-like.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={romanticFont.variable}>
      <body>{children}</body>
    </html>
  );
}

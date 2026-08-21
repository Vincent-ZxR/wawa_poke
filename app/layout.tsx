import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "wawawawa",
  description: "Mini aventure romantique inspirée d'un très petit Pokémon-like.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

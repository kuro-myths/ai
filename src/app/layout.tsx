import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kuro AI — Your AI workspace",
  description: "A personal AI workspace powered by your 9Router gateway.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}

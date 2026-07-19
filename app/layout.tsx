import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Growth Loop | Freitas Growth AI",
  description: "Plataforma de campanhas de indicação e geração de leads.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body><Providers>{children}</Providers></body></html>;
}

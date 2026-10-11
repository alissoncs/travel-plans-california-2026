import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Shell from "@/components/Shell";
import { ViagemProvider } from "@/components/Viagem";
import roteiro from "@/data/roteiro.json";
import guias from "@/data/guias.json";
import type { Guias, Roteiro } from "@/lib/types";

const figtree = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-figtree" });

export const metadata: Metadata = {
  title: { default: "Califórnia 2026", template: "%s · Califórnia 2026" },
  description: "Roteiro da viagem de 17 a 28 de novembro de 2026, de San Diego a San Francisco.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={figtree.variable}>
      <body>
        <ViagemProvider roteiro={roteiro as unknown as Roteiro} guias={guias as unknown as Guias}>
          <Shell>{children}</Shell>
        </ViagemProvider>
      </body>
    </html>
  );
}

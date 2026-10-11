import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Shell from "@/components/Shell";
import { TripProvider } from "@/components/TripProvider";
import { guides, itinerary } from "@/lib/data";

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
        <TripProvider itinerary={itinerary} guides={guides}>
          <Shell>{children}</Shell>
        </TripProvider>
      </body>
    </html>
  );
}

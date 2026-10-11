import type { Metadata } from "next";
import Place from "@/components/pages/Place";
import { itinerary, placeKeys } from "@/lib/data";

type Params = { params: Promise<{ chave: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => placeKeys.map((chave) => ({ chave }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return { title: itinerary.lugares[(await params).chave]?.nome ?? "Lugar" };
}

export default async function Page({ params }: Params) {
  return <Place placeKey={(await params).chave} />;
}

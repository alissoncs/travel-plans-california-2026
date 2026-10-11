import type { Metadata } from "next";
import Day from "@/components/pages/Day";
import { dayIds, itinerary } from "@/lib/data";

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => dayIds.map((id) => ({ id }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const day = itinerary.dias.find((d) => d.id === id);
  return { title: day ? `Dia ${day.rotulo} · ${day.titulo}` : "Dia" };
}

export default async function Page({ params }: Params) {
  return <Day id={(await params).id} />;
}

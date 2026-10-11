import type { Metadata } from "next";
import Dia from "@/components/paginas/Dia";
import roteiro from "@/data/roteiro.json";

export const dynamicParams = false;
export const generateStaticParams = () => roteiro.dias.map((d) => ({ id: d.id }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const d = roteiro.dias.find((x) => x.id === id);
  return { title: d ? `Dia ${d.rotulo} · ${d.titulo}` : "Dia" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Dia id={id} />;
}

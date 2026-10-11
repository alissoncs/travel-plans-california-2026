import type { Metadata } from "next";
import Lugar from "@/components/paginas/Lugar";
import roteiro from "@/data/roteiro.json";

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(roteiro.lugares).map((chave) => ({ chave }));

export async function generateMetadata({ params }: { params: Promise<{ chave: string }> }): Promise<Metadata> {
  const { chave } = await params;
  return { title: (roteiro.lugares as Record<string, { nome: string }>)[chave]?.nome ?? "Lugar" };
}

export default async function Page({ params }: { params: Promise<{ chave: string }> }) {
  const { chave } = await params;
  return <Lugar chave={chave} />;
}

import MapaPagina from "@/components/paginas/MapaPagina";
import roteiro from "@/data/roteiro.json";

export const metadata = { title: "Mapa" };
export const dynamicParams = false;
export const generateStaticParams = () => [
  { foco: [] },
  { foco: ["comer"] },
  ...roteiro.dias.map((d) => ({ foco: [d.id] })),
  ...Object.keys(roteiro.lugares).map((k) => ({ foco: [`lugar-${k}`] })),
];

export default function Page() {
  return <MapaPagina />;
}

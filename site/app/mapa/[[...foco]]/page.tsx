import MapRedirect from "@/components/pages/MapRedirect";
import { dayIds, placeKeys } from "@/lib/data";
import { placeFocus } from "@/lib/routes";

export const metadata = { title: "Mapa" };
export const dynamicParams = false;
export const generateStaticParams = () =>
  [[], ["comer"], ...dayIds.map((id) => [id]), ...placeKeys.map((key) => [placeFocus(key)])].map((foco) => ({ foco }));

export default function Page() {
  return <MapRedirect />;
}

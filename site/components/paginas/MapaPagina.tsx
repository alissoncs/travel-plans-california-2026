"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { caminhoDoFoco } from "@/lib/rotas";

// O mapa em si fica no Shell. Em telas largas ele já aparece ao lado da página,
// então /mapa/<foco> só leva para a página do foco.
export default function MapaPagina() {
  const router = useRouter();
  const foco = decodeURIComponent(usePathname().split("/")[2] ?? "");
  useEffect(() => {
    const mq = matchMedia("(min-width: 1100px)");
    const ir = () => mq.matches && router.replace(caminhoDoFoco(foco));
    ir();
    mq.addEventListener("change", ir);
    return () => mq.removeEventListener("change", ir);
  }, [foco, router]);
  return null;
}

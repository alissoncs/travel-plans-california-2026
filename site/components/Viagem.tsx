"use client";
import { createContext, useContext, useMemo } from "react";
import { criarApi, type Api } from "@/lib/api";
import { useSalvo } from "@/lib/store";
import type { Guias, PlanoId, Roteiro } from "@/lib/types";

interface Ctx extends Api {
  setPlano: (p: PlanoId) => void;
  pronto: boolean;
}
const C = createContext<Ctx | null>(null);

export function ViagemProvider({ roteiro, guias, children }: { roteiro: Roteiro; guias: Guias; children: React.ReactNode }) {
  const [salvo, setSalvo, pronto] = useSalvo<PlanoId>("plano", roteiro.viagem.plano_recomendado);
  const plano = roteiro.planos[salvo] ? salvo : roteiro.viagem.plano_recomendado;
  const api = useMemo(() => criarApi(roteiro, guias, plano), [roteiro, guias, plano]);
  const valor = useMemo(() => ({ ...api, setPlano: setSalvo, pronto }), [api, setSalvo, pronto]);
  return <C.Provider value={valor}>{children}</C.Provider>;
}

export function useViagem() {
  const v = useContext(C);
  if (!v) throw new Error("useViagem fora do ViagemProvider");
  return v;
}

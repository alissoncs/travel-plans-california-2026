"use client";
import { useCallback, useEffect, useState } from "react";

function ler<T>(k: string, padrao: T): T {
  try {
    const v = localStorage.getItem(k);
    return v === null ? padrao : (JSON.parse(v) as T);
  } catch {
    return padrao;
  }
}
function gravar(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

// Estado guardado no navegador. Começa com o padrão (igual no servidor) e lê o salvo ao montar.
export function useSalvo<T>(chave: string, padrao: T) {
  const [valor, setValor] = useState<T>(padrao);
  const [lido, setLido] = useState(false);
  useEffect(() => {
    setValor(ler(chave, padrao));
    setLido(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  const mudar = useCallback(
    (v: T | ((a: T) => T)) => {
      setValor((a) => {
        const novo = typeof v === "function" ? (v as (a: T) => T)(a) : v;
        gravar(chave, novo);
        return novo;
      });
    },
    [chave],
  );
  return [valor, mudar, lido] as const;
}

"use client";
import { useEffect, useState } from "react";

// Os valores são os mesmos de antes para não perder o que já está salvo no navegador.
export const STORAGE_KEYS = { plan: "plano", doneBookings: "reservas-feitas", mapLayers: "mapa-camadas" } as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Começa com o valor padrão (igual no servidor) e troca pelo salvo depois de montar.
export function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState(fallback);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setValue(read(key, fallback));
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (loaded) write(key, value);
  }, [key, value, loaded]);
  return [value, setValue, loaded] as const;
}

export const useDoneBookings = () => useStored<Record<string, boolean>>(STORAGE_KEYS.doneBookings, {});

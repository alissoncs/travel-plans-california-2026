"use client";
import { createContext, useContext, useMemo } from "react";
import { useStored, STORAGE_KEYS } from "@/lib/storage";
import { createTrip, type Trip } from "@/lib/trip";
import type { Guides, Itinerary, PlanId } from "@/lib/types";

interface TripContext extends Trip {
  setPlan: (plan: PlanId) => void;
  ready: boolean;
}
const Context = createContext<TripContext | null>(null);

export function TripProvider({ itinerary, guides, children }: { itinerary: Itinerary; guides: Guides; children: React.ReactNode }) {
  const [stored, setPlan, ready] = useStored<PlanId>(STORAGE_KEYS.plan, itinerary.viagem.plano_recomendado);
  const plan = itinerary.planos[stored] ? stored : itinerary.viagem.plano_recomendado;
  const trip = useMemo(() => createTrip(itinerary, guides, plan), [itinerary, guides, plan]);
  const value = useMemo(() => ({ ...trip, setPlan, ready }), [trip, setPlan, ready]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTrip() {
  const value = useContext(Context);
  if (!value) throw new Error("useTrip precisa estar dentro de TripProvider");
  return value;
}

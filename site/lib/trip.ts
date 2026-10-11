import { parseDate } from "./format";
import type { Activity, Day, Expense, GuideItem, GuideSection, Guides, Itinerary, Place, PlanId } from "./types";

export const WINDOW_HOURS = 12;

export interface Occupancy {
  hours: number;
  pct: number;
  free: number;
  level: "light" | "medium" | "full";
}

export interface PlaceInPlan extends Place {
  key: string;
  days: Day[];
  activities: Activity[];
  types: Set<string>;
}

export type TipOrigin = { kind: "day"; day: Day } | { kind: "place"; key: string };

// Tudo o que depende do roteiro, dos guias e do plano escolhido.
export function createTrip(itinerary: Itinerary, guides: Guides, plan: PlanId) {
  const days = itinerary.dias.filter((day) => day.planos.includes(plan));
  const expenses: Expense[] = (itinerary.orcamento?.itens ?? []).filter((expense) => expense.planos.includes(plan));

  const imageOf = (placeKey: string) => itinerary.lugares[placeKey]?.imagem;
  const expensesOfDay = (day: Day) => expenses.filter((e) => e.data && e.data >= day.data && e.data <= (day.data_fim ?? day.data));
  const totalOf = (list: Expense[]) => list.filter((e) => e.status !== "opcional").reduce((sum, e) => sum + e.usd, 0);

  // horas das atividades (sem as opcionais) mais a estrada, sobre uma janela de 12h (8h às 20h)
  function occupancyOf(day: Day): Occupancy | null {
    if (day.evento) return null;
    const hours =
      day.atividades.filter((a) => !a.opcional).reduce((sum, a) => sum + (a.horas ?? 0), 0) +
      (day.estrada ?? []).reduce((sum, leg) => sum + (leg.horas ?? 0), 0);
    if (!hours) return null;
    const pct = Math.min(100, Math.round((hours / WINDOW_HOURS) * 100));
    return { hours, pct, free: Math.max(0, WINDOW_HOURS - hours), level: pct <= 50 ? "light" : pct <= 70 ? "medium" : "full" };
  }

  const places = (() => {
    const byKey = new Map<string, PlaceInPlan>();
    for (const day of days) {
      for (const activity of day.atividades) {
        const key = activity.lugar;
        if (!key || !itinerary.lugares[key]) continue;
        const place = byKey.get(key) ?? { key, ...itinerary.lugares[key], days: [], activities: [], types: new Set<string>() };
        if (!place.days.includes(day)) place.days.push(day);
        place.activities.push(activity);
        place.types.add(activity.tipo);
        byKey.set(key, place);
      }
    }
    return [...byKey.values()];
  })();

  function allTips() {
    const tips: { item: GuideItem; section: GuideSection; origin: TipOrigin }[] = [];
    for (const day of days) for (const section of guides.dias[day.id]?.secoes ?? []) for (const item of section.itens) tips.push({ item, section, origin: { kind: "day", day } });
    for (const [key, guide] of Object.entries(guides.lugares)) for (const section of guide.secoes ?? []) for (const item of section.itens) tips.push({ item, section, origin: { kind: "place", key } });
    return tips;
  }

  return { itinerary, guides, plan, days, expenses, places, imageOf, expensesOfDay, totalOf, occupancyOf, allTips };
}
export type Trip = ReturnType<typeof createTrip>;

export function countdown(itinerary: Itinerary): { value: number | string; label: string } {
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);
  const start = parseDate(itinerary.viagem.inicio);
  const end = parseDate(itinerary.viagem.fim);
  const daysToGo = Math.round((start.getTime() - today.getTime()) / 864e5);
  if (daysToGo > 1) return { value: daysToGo, label: "dias para a viagem" };
  if (daysToGo === 1) return { value: 1, label: "dia para a viagem" };
  if (today <= end) return { value: Math.round((today.getTime() - start.getTime()) / 864e5) + 1, label: "º dia de viagem" };
  return { value: "✓", label: "viagem concluída" };
}

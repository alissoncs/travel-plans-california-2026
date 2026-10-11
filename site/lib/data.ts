import itineraryJson from "@/data/roteiro.json";
import guidesJson from "@/data/guias.json";
import type { Guides, Itinerary } from "./types";

export const itinerary = itineraryJson as unknown as Itinerary;
export const guides = guidesJson as unknown as Guides;

export const dayIds = itinerary.dias.map((day) => day.id);
export const placeKeys = Object.keys(itinerary.lugares);

"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTrip } from "../TripProvider";
import { WIDE_QUERY } from "@/lib/env";
import { routeOf } from "@/lib/routes";

// O mapa fica no Shell. Em telas largas ele já aparece ao lado da página,
// então /mapa/<foco> só leva para a página do foco.
export default function MapRedirect() {
  const router = useRouter();
  const { itinerary } = useTrip();
  const back = routeOf(usePathname(), itinerary).back!;
  useEffect(() => {
    const query = matchMedia(WIDE_QUERY);
    const redirect = () => query.matches && router.replace(back);
    redirect();
    query.addEventListener("change", redirect);
    return () => query.removeEventListener("change", redirect);
  }, [back, router]);
  return null;
}

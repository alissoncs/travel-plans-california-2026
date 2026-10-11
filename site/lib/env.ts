export const WIDE_QUERY = "(min-width: 1100px)";
export const isWide = () => matchMedia(WIDE_QUERY).matches;
export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? "auto" : "smooth");

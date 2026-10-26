import { useQuery } from "@tanstack/react-query";
import logoUrl from "./jyc-logo.jpg";
import { api } from "@/services/api";

// Import the local file so Vite serves it in development and includes it in builds.
// The asset metadata URL only works in the original hosted preview environment.
export const LOGO_URL: string = logoUrl;
export type SiteImageSlot = "hero" | "login" | "register" | "about" | "campus";

/** Site images are managed by the backend; missing slots use the existing branded fallback. */
export function useSiteImage(slot: SiteImageSlot): string | null {
  const { data } = useQuery({ queryKey: ["site-asset", slot], queryFn: () => api.getSiteAsset(slot), staleTime: 5 * 60_000, retry: false });
  return data?.url ?? null;
}

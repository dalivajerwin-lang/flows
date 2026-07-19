import { useCurrentProfile } from "@/stores/auth-store";
import type { Role } from "@/lib/constants";

export function useRole(): Role | null {
  return useCurrentProfile()?.role ?? null;
}

export function isManagerish(role: Role | null): boolean {
  return role === "manager" || role === "superadmin";
}

export function useIsSuperadmin(): boolean {
  return useRole() === "superadmin";
}

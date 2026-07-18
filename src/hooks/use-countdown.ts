import { useEffect, useState } from "react";
import { useTicker } from "@/stores/ticker-store";
import { formatCountdown } from "@/lib/format";

export function useCountdown(targetIso: string | null | undefined): string {
  const now = useTicker((s) => s.now);
  const start = useTicker((s) => s.start);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    start();
  }, [start]);
  if (!mounted || !targetIso || now === 0) return "";
  return formatCountdown(new Date(targetIso).getTime() - now);
}

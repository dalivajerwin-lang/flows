import { create } from "zustand";

// Single app-wide 1s ticker. Components subscribe via useTicker() — never create their own setInterval.
interface TickerState {
  now: number;
  _timer: ReturnType<typeof setInterval> | null;
  start: () => void;
  stop: () => void;
}

export const useTicker = create<TickerState>((set, get) => ({
  now: 0,
  _timer: null,
  start: () => {
    if (get()._timer || typeof window === "undefined") return;
    const timer = setInterval(() => set({ now: Date.now() }), 1000);
    set({ _timer: timer });
  },
  stop: () => {
    const t = get()._timer;
    if (t) clearInterval(t);
    set({ _timer: null });
  },
}));

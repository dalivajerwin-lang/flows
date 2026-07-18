import { create } from "zustand";

interface LeadDialogsState {
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
}

export const useLeadDialogs = create<LeadDialogsState>((set) => ({
  addOpen: false,
  setAddOpen: (v) => set({ addOpen: v }),
}));

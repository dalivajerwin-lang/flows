import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AssistantMode = "conversational" | "notifications" | "console";

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  category: string;
  created_at: string;
}

export type ChatRole = "user" | "ai";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
  /** widget key rendered inline below the text, if any */
  widget?: ChatWidget;
  /** stable ids captured at render time for entity chip resolution */
  entityIds?: { leads: string[]; agents: string[] };
  /** temporary action data for replies like numbered lead suggestions */
  meta?: { leadSuggestionIds?: string[] };
  /** marks the daily auto-briefing so a refresh replaces it in place */
  isBriefing?: boolean;
}

export type ChatWidget =
  | { kind: "panel"; panelKey: string }
  | { kind: "page_link"; to: string; label: string }
  | { kind: "stage_transition"; leadId: string; toStage: string }
  | { kind: "lead_suggestions"; leadIds: string[] };

interface AssistantState {
  mode: AssistantMode;
  consoleExpanded: boolean; // desktop: whether the console pane is showing
  briefingShownAt: Record<string, number>; // per userId — persisted, ms timestamp of last briefing
  todos: Record<string, TodoItem[]>; // per userId
  links: LinkItem[];
  messages: Record<string, ChatMessage[]>; // per userId
  setMode: (m: AssistantMode) => void;
  toggleConsole: () => void;
  markBriefingShown: (userId: string) => void;
  addTodo: (userId: string, text: string) => void;
  toggleTodo: (userId: string, id: string) => void;
  removeTodo: (userId: string, id: string) => void;
  pushMessage: (userId: string, m: ChatMessage) => void;
  /**
   * Insert-or-replace the daily briefing. If a briefing message already
   * exists in the thread it is updated in place (fresh text, same position)
   * instead of appending a duplicate — refreshes must not stack greetings.
   */
  upsertBriefing: (userId: string, m: ChatMessage) => void;
  clearMessages: (userId: string) => void;
  addLink: (l: Omit<LinkItem, "id" | "created_at">) => void;
  updateLink: (id: string, patch: Partial<Omit<LinkItem, "id" | "created_at">>) => void;
  deleteLink: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const initialLinks: LinkItem[] = [];

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      mode: "conversational",
      consoleExpanded: true,
      briefingShownAt: {},
      todos: {},
      links: initialLinks,
      messages: {},
      setMode: (mode) => set({ mode }),
      toggleConsole: () => set((s) => ({ consoleExpanded: !s.consoleExpanded })),
      markBriefingShown: (userId) =>
        set((s) => ({ briefingShownAt: { ...s.briefingShownAt, [userId]: Date.now() } })),
      addTodo: (userId, text) =>
        set((s) => {
          const list = s.todos[userId] ?? [];
          return {
            todos: {
              ...s.todos,
              [userId]: [
                ...list,
                { id: uid(), text, done: false, created_at: new Date().toISOString() },
              ],
            },
          };
        }),
      toggleTodo: (userId, id) =>
        set((s) => {
          const list = s.todos[userId] ?? [];
          return {
            todos: {
              ...s.todos,
              [userId]: list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
            },
          };
        }),
      removeTodo: (userId, id) =>
        set((s) => {
          const list = s.todos[userId] ?? [];
          return { todos: { ...s.todos, [userId]: list.filter((t) => t.id !== id) } };
        }),
      pushMessage: (userId, m) =>
        set((s) => {
          const list = s.messages[userId] ?? [];
          return { messages: { ...s.messages, [userId]: [...list, m] } };
        }),
      upsertBriefing: (userId, m) =>
        set((s) => {
          const list = s.messages[userId] ?? [];
          const briefing = { ...m, isBriefing: true };
          const idx = list.findIndex((x) => x.isBriefing);
          const next =
            idx === -1
              ? [...list, briefing]
              : list.map((x, i) => (i === idx ? { ...briefing, id: x.id } : x));
          return { messages: { ...s.messages, [userId]: next } };
        }),
      clearMessages: (userId) => set((s) => ({ messages: { ...s.messages, [userId]: [] } })),
      addLink: (l) =>
        set((s) => ({
          links: [...s.links, { ...l, id: uid(), created_at: new Date().toISOString() }],
        })),
      updateLink: (id, patch) =>
        set((s) => ({ links: s.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      deleteLink: (id) => set((s) => ({ links: s.links.filter((l) => l.id !== id) })),
    }),
    {
      name: "tenacious:assistant",
      partialize: (s) => ({
        mode: s.mode,
        consoleExpanded: s.consoleExpanded,
        briefingShownAt: s.briefingShownAt,
        todos: s.todos,
        links: s.links,
        messages: s.messages,
      }),
    },
  ),
);

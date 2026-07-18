import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/stores/assistant-store";
import { scanEntities, type EntityRef } from "@/lib/assistant/entities";
import { useReducedMotion } from "@/lib/reduced-motion";
import { AssistantAvatar } from "./AssistantAvatar";
import { ChatWidget, type WidgetStepState } from "./ChatWidget";

interface Props {
  message: ChatMessage;
  entityRefs: EntityRef[];
  typewriter: boolean;
  widgetState?: WidgetStepState;
}

export function ChatBubble({ message, entityRefs, typewriter, widgetState }: Props) {
  const isUser = message.role === "user";
  const full = message.text;
  const reducedMotion = useReducedMotion();
  const effectiveTypewriter = typewriter && !reducedMotion;
  const [shown, setShown] = useState(effectiveTypewriter ? "" : full);
  const [done, setDone] = useState(!effectiveTypewriter);

  useEffect(() => {
    if (!effectiveTypewriter) {
      setShown(full);
      setDone(true);
      return;
    }
    // Recursive setTimeout — the app allows exactly one setInterval (the global ticker).
    let i = 0;
    let cancelled = false;
    let handle: ReturnType<typeof setTimeout> | null = null;
    const step = () => {
      if (cancelled) return;
      i++;
      setShown(full.slice(0, i));
      const el = document.getElementById("chat-thread");
      if (el) el.scrollTop = el.scrollHeight;
      if (i >= full.length) {
        setDone(true);
        return;
      }
      handle = setTimeout(step, 15);
    };
    handle = setTimeout(step, 15);
    return () => {
      cancelled = true;
      if (handle) clearTimeout(handle);
    };
  }, [effectiveTypewriter, full]);

  const segments = done
    ? scanEntities(shown, entityRefs)
    : [{ kind: "text" as const, text: shown }];

  return (
    <div className={cn("flex w-full mb-1", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] px-4 py-3 text-sm leading-relaxed shadow-xs transition-all duration-200",
          isUser
            ? "bg-[var(--color-primary)] text-white rounded-2xl rounded-tr-xs"
            : "bg-white border border-[var(--color-border-subtle)] text-[var(--color-text-strong)] rounded-2xl rounded-tl-xs",
        )}
      >
        <div className="whitespace-pre-wrap">
          {segments.map((s, i) => {
            if (s.kind === "text") return <span key={i}>{s.text}</span>;
            const icon = s.type === "lead" ? "👤" : "🧑‍💼";
            return (
              <button
                key={i}
                type="button"
                data-action="entity"
                data-entity-type={s.type}
                data-entity-id={s.id}
                className={cn(
                  "mx-1 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold border transition-all duration-150 cursor-pointer align-baseline select-none",
                  s.type === "lead"
                    ? isUser
                      ? "bg-white/20 text-white border-white/30 hover:bg-white hover:text-[var(--color-primary-hover)]"
                      : "bg-[var(--color-primary-light)] text-[var(--color-primary-hover)] border-[var(--color-primary-hover)]/20 hover:bg-[var(--color-primary)] hover:text-white"
                    : isUser
                      ? "bg-white/20 text-white border-white/30 hover:bg-white hover:text-[var(--color-text-strong)]"
                      : "bg-[var(--color-surface-muted)] text-[var(--color-text-soft)] border-[var(--color-border-muted)] hover:bg-[var(--color-text-soft)] hover:text-white",
                )}
              >
                <span>{icon}</span>
                <span>{s.text}</span>
              </button>
            );
          })}
          {!done && (
            <span
              className={cn(
                "ml-0.5 inline-block h-4 w-0.5 animate-pulse align-middle",
                isUser ? "bg-white" : "bg-[var(--color-text-subtle)]",
              )}
            />
          )}
        </div>

        {done && message.widget && (
          <div className="mt-3">
            <ChatWidget widget={message.widget} messageId={message.id} state={widgetState} />
          </div>
        )}

        {!isUser && done && (
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              data-action="speak"
              data-msg-id={message.id}
              className="text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] cursor-pointer"
              aria-label="Read aloud"
            >
              <Volume2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

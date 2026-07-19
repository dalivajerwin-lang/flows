import { useEffect, useRef, useState } from "react";
import { Mic, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssistantLead } from "@/lib/assistant/lead-search";

interface Props {
  onSubmit: (text: string) => void;
  onQueryPeople: (q: string) => AssistantLead[];
}

type SRInstance = {
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  interimResults: boolean;
  continuous: boolean;
  lang: string;
};
type SRCtor = new () => SRInstance;

function getSR(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function InputRow({ onSubmit, onQueryPeople }: Props) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const [suggestions, setSuggestions] = useState<AssistantLead[]>([]);
  const [kbOffset, setKbOffset] = useState(0);
  const recognitionRef = useRef<SRInstance | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasMic = !!getSR();

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const onResize = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbOffset(offset);
    };
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, []);

  useEffect(() => {
    const m = value.match(/(?:\/|\bcall |\bnote |\bmove |\bto )([\w'-]{2,})$/i);
    if (m) {
      setSuggestions(onQueryPeople(m[1]));
    } else {
      setSuggestions([]);
    }
  }, [value, onQueryPeople]);

  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const startMic = () => {
    const SR = getSR();
    if (!SR) return;
    const rec = new SR();
    rec.interimResults = false;
    rec.continuous = false;
    rec.lang = "en-PH";
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setValue((v) => (v ? `${v} ${transcript}` : transcript));
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };
  const stopMic = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div
      className="relative border-t border-[var(--color-border-subtle)] bg-[var(--color-background)] px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.02)] z-20 shrink-0"
      style={{ transform: `translateY(-${kbOffset}px)` }}
    >
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-2 max-h-40 overflow-y-auto rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-background)]/95 backdrop-blur-md p-1.5 shadow-lg z-30">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
            Suggested People
          </div>
          {suggestions.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                const withName = value.replace(/[\w'-]{2,}$/, l.full_name);
                setValue(withName + " ");
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--color-text-strong)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-hover)] transition-colors cursor-pointer select-none font-medium"
            >
              <span className="text-xs">👤</span>
              <span>{l.full_name}</span>
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2.5"
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-h-[44px] flex-1 rounded-full border border-[var(--color-border-muted)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] focus:bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-text-strong)] outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(6,148,148,0.15)] transition-all duration-200 placeholder:text-[var(--color-text-placeholder)]"
          placeholder='Try "agenda", "call Anna", or "todo prep for tripping"…'
        />
        {hasMic && (
          <button
            type="button"
            onClick={listening ? stopMic : startMic}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs",
              listening
                ? "bg-[var(--color-danger-soft-bg)] border-[var(--color-danger-soft-border)]"
                : "bg-[var(--color-background)] border-[var(--color-border-muted)] hover:bg-[var(--color-surface)] hover:border-[var(--color-text-subtle)]",
            )}
            aria-label={listening ? "Stop listening" : "Start voice input"}
          >
            {listening ? (
              <div className="flex items-center gap-0.5 h-4 justify-center">
                {[0, 100, 200].map((d) => (
                  <span
                    key={d}
                    className="block w-0.5 rounded bg-[var(--color-danger-soft-fg)] origin-center"
                    style={{
                      height: 12,
                      animation: `mic-bar 0.6s ease-in-out ${d}ms infinite`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <Mic size={16} className="text-[var(--color-text-soft)]" />
            )}
          </button>
        )}
        <button
          type="submit"
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-sm shadow-[var(--color-primary)]/10 disabled:opacity-50 disabled:pointer-events-none"
          disabled={!value.trim()}
        >
          <Send size={16} />
        </button>
      </form>
      <style>{`@keyframes mic-bar { 0% { transform: scaleY(0.4) } 50% { transform: scaleY(1.3) } 100% { transform: scaleY(0.4) } }`}</style>
    </div>
  );
}

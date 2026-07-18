import { AssistantAvatar } from "./AssistantAvatar";

export function TypingIndicator() {
  return (
    <div className="mb-2 flex items-center gap-2">
      <AssistantAvatar priorityAlert={false} />
      <div className="flex items-center gap-1 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 backdrop-blur-md">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-subtle)]"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

import { Clock } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
}

export function ComingSoonGate({
  title = "Coming Soon",
  description = "Premium content and coin features are on their way. Check back soon!",
}: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-20 px-6 rounded-2xl"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ background: "rgba(196,66,106,0.1)" }}
      >
        <Clock size={28} style={{ color: "#c4426a" }} />
      </div>
      <h2
        className="text-2xl font-bold mb-3"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        {title}
      </h2>
      <p className="text-sm max-w-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        {description}
      </p>
    </div>
  );
}

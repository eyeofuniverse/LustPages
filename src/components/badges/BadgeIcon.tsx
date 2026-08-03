import { getBadge, TIER_COLORS, type BadgeDef } from "@/lib/badges";

interface Props {
  badge: BadgeDef;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  earned?: boolean;
}

const SIZE = {
  sm: { wrap: "w-8 h-8 text-base",  icon: "text-lg",  label: "text-xs" },
  md: { wrap: "w-11 h-11 text-xl",  icon: "text-2xl", label: "text-xs" },
  lg: { wrap: "w-14 h-14 text-3xl", icon: "text-3xl", label: "text-sm" },
};

export function BadgeIcon({ badge, size = "md", showLabel = false, earned = true }: Props) {
  const palette = TIER_COLORS[badge.tier];
  const sz = SIZE[size];

  return (
    <div
      className={`flex flex-col items-center gap-1 ${!earned ? "opacity-30 grayscale" : ""}`}
      title={`${badge.name} — ${badge.description}`}
    >
      <div
        className={`${sz.wrap} rounded-xl flex items-center justify-center shrink-0`}
        style={{
          background: palette.bg,
          border: `1.5px solid ${palette.border}`,
          color: palette.color,
        }}
      >
        <span className={sz.icon}>{badge.icon}</span>
      </div>
      {showLabel && (
        <span
          className={`${sz.label} font-semibold text-center leading-tight max-w-[72px]`}
          style={{ color: palette.color }}
        >
          {badge.name}
        </span>
      )}
    </div>
  );
}

/** Inline chip variant — used in comments next to the commenter name. */
export function BadgeChip({ badgeId }: { badgeId: string }) {
  const badge = getBadge(badgeId);
  if (!badge) return null;
  const palette = TIER_COLORS[badge.tier];
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold leading-none"
      style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}
      title={`${badge.name}: ${badge.description}`}
    >
      {badge.icon} {badge.name}
    </span>
  );
}

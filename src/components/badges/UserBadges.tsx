import { ALL_BADGES, TIER_COLORS, TIER_ORDER, type BadgeCategory, type BadgeDef } from "@/lib/badges";
import { BadgeIcon } from "./BadgeIcon";

interface EarnedBadge {
  badgeId: string;
  awardedAt: Date | string;
}

interface Props {
  earned: EarnedBadge[];
  category?: BadgeCategory | "all";
  showLocked?: boolean;
}

const TIER_LABEL: Record<string, string> = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

/** Compact 32 px emoji-only badge cell — scales to 8-9 per row on mobile. */
function BadgeCell({
  badge,
  isEarned,
  awardedAt,
}: {
  badge: BadgeDef;
  isEarned: boolean;
  awardedAt?: Date | string;
}) {
  const palette = TIER_COLORS[badge.tier];
  const tip = isEarned
    ? `${badge.name} — ${badge.description}\nEarned: ${new Date(awardedAt!).toLocaleDateString()}`
    : `${badge.name} — ${badge.description}`;

  return (
    <div
      title={tip}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 cursor-default select-none transition-transform active:scale-95 hover:scale-110"
      style={{
        background: isEarned ? palette.bg : "var(--muted)",
        border: `1.5px solid ${isEarned ? palette.border : "transparent"}`,
        opacity: isEarned ? 1 : 0.35,
        filter: isEarned ? "none" : "grayscale(1)",
      }}
    >
      {badge.icon}
    </div>
  );
}

export function UserBadges({ earned, category = "all", showLocked = true }: Props) {
  const earnedSet = new Set(earned.map((b) => b.badgeId));
  const earnedMap = new Map(earned.map((b) => [b.badgeId, b.awardedAt]));

  const filtered =
    category === "all" ? ALL_BADGES : ALL_BADGES.filter((b) => b.category === category);

  const tiers = (["platinum", "gold", "silver", "bronze"] as const).map((tier) => ({
    tier,
    badges: filtered.filter((b) => b.tier === tier),
  }));

  const earnedCount = filtered.filter((b) => earnedSet.has(b.id)).length;
  const totalCount = filtered.length;
  const pct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  if (earnedCount === 0 && !showLocked) {
    return (
      <p className="text-sm italic" style={{ color: "var(--muted-foreground)" }}>
        No badges earned yet.
      </p>
    );
  }

  return (
    <div>
      {/* Progress bar — only when showing locked (private profile) */}
      {showLocked && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {earnedCount} / {totalCount} earned
            </span>
            <span className="text-xs font-semibold" style={{ color: "#c4426a" }}>
              {pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #c4426a 0%, #e05585 100%)",
              }}
            />
          </div>
        </div>
      )}

      {/* Tier rows */}
      <div className="space-y-4">
        {tiers.map(({ tier, badges }) => {
          const tieredEarned = badges.filter((b) => earnedSet.has(b.id));
          if (!showLocked && tieredEarned.length === 0) return null;

          const palette = TIER_COLORS[tier];
          const display = showLocked ? badges : tieredEarned;

          return (
            <div key={tier}>
              {/* Tier label + divider + count */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: palette.bg,
                    color: palette.color,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  {TIER_LABEL[tier]}
                </span>
                <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                <span className="text-[10px] shrink-0" style={{ color: "var(--muted-foreground)" }}>
                  {tieredEarned.length}/{badges.length}
                </span>
              </div>

              {/* Badge cells — flex-wrap gives ~8-9 per row on 340 px mobile */}
              <div className="flex flex-wrap gap-1.5">
                {display.map((badge) => (
                  <BadgeCell
                    key={badge.id}
                    badge={badge}
                    isEarned={earnedSet.has(badge.id)}
                    awardedAt={earnedMap.get(badge.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Compact strip of the most prestigious earned badges — used in profile headers. */
export function EarnedBadgeStrip({
  earned,
  max = 5,
}: {
  earned: EarnedBadge[];
  max?: number;
}) {
  if (earned.length === 0) return null;

  const sorted = [...earned]
    .map((b) => ({ ...b, def: ALL_BADGES.find((d) => d.id === b.badgeId) }))
    .filter((b): b is typeof b & { def: BadgeDef } => !!b.def)
    .sort((a, b) => {
      const tierDiff = TIER_ORDER[b.def.tier] - TIER_ORDER[a.def.tier];
      if (tierDiff !== 0) return tierDiff;
      return new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime();
    });

  const visible = sorted.slice(0, max);
  const remaining = earned.length - visible.length;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {visible.map(({ badgeId, def }) => (
        <BadgeIcon key={badgeId} badge={def} size="sm" showLabel={false} earned />
      ))}
      {remaining > 0 && (
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          +{remaining} more
        </span>
      )}
    </div>
  );
}

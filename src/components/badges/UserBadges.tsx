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

export function UserBadges({ earned, category = "all", showLocked = true }: Props) {
  const earnedSet = new Set(earned.map((b) => b.badgeId));
  const earnedMap = new Map(earned.map((b) => [b.badgeId, b.awardedAt]));

  const filtered = category === "all"
    ? ALL_BADGES
    : ALL_BADGES.filter((b) => b.category === category);

  // Group by tier, highest first
  const tiers = (["platinum", "gold", "silver", "bronze"] as const).map((tier) => ({
    tier,
    badges: filtered.filter((b) => b.tier === tier),
  }));

  const earnedCount = filtered.filter((b) => earnedSet.has(b.id)).length;

  if (earnedCount === 0 && !showLocked) {
    return (
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        No badges earned yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        {earnedCount} / {filtered.length} badges earned
      </p>

      {tiers.map(({ tier, badges }) => {
        if (!showLocked && badges.every((b) => !earnedSet.has(b.id))) return null;
        const palette = TIER_COLORS[tier];

        return (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}
              >
                {TIER_LABEL[tier]}
              </span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {badges.filter((b) => earnedSet.has(b.id)).length}/{badges.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => {
                const isEarned = earnedSet.has(badge.id);
                const awardedAt = earnedMap.get(badge.id);
                return (
                  <div key={badge.id} className="flex flex-col items-center gap-1" title={isEarned ? `Earned: ${new Date(awardedAt!).toLocaleDateString()}` : badge.description}>
                    <BadgeIcon badge={badge} size="md" showLabel earned={isEarned} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Compact strip showing only earned badges — used in profile headers. */
export function EarnedBadgeStrip({ earned, max = 5 }: { earned: EarnedBadge[]; max?: number }) {
  if (earned.length === 0) return null;

  // Sort earned by tier desc, then awardedAt desc
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
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
          +{remaining} more
        </span>
      )}
    </div>
  );
}

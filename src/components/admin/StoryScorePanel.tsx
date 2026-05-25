"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { computeStoryScore, getTopTips, ScoreItem, StoryScoreInput } from "@/lib/storyScore";

function ScoreArc({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const fill = circ * (score / 100);
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
      <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--muted)" strokeWidth="7" />
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none" style={{ color }}>{score}</span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/ 100</span>
      </div>
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${score}%`, background: color, transition: "width 0.4s ease" }}
      />
    </div>
  );
}

function StatusIcon({ status }: { status: ScoreItem["status"] }) {
  if (status === "good") return <CheckCircle size={13} style={{ color: "#22c55e", flexShrink: 0 }} />;
  if (status === "warn") return <AlertCircle size={13} style={{ color: "#f59e0b", flexShrink: 0 }} />;
  return <XCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />;
}

function ItemRow({ item }: { item: ScoreItem }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5"><StatusIcon status={item.status} /></span>
      <div className="min-w-0 flex-1">
        <span className="text-xs" style={{ color: "var(--foreground)" }}>{item.label}</span>
        {item.status !== "good" && (
          <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--muted-foreground)" }}>{item.tip}</p>
        )}
      </div>
      <span className="text-xs font-medium shrink-0 tabular-nums" style={{ color: "var(--muted-foreground)" }}>
        {item.earned}/{item.max}
      </span>
    </div>
  );
}

export function StoryScorePanel({ input }: { input: StoryScoreInput }) {
  const result = computeStoryScore(input);
  const tips = getTopTips(result, 3);
  const [expanded, setExpanded] = useState<string | null>(null);

  const overallColor = result.overall >= 70 ? "#22c55e" : result.overall >= 45 ? "#f59e0b" : "#ef4444";
  const overallLabel = result.overall >= 80 ? "Great" : result.overall >= 70 ? "Good" : result.overall >= 45 ? "Needs work" : "Incomplete";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="p-5 space-y-5">
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Story Score</h3>

        {/* Overall arc */}
        <div className="flex items-center gap-4">
          <ScoreArc score={result.overall} />
          <div>
            <p className="font-bold text-base" style={{ color: overallColor }}>{overallLabel}</p>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--muted-foreground)" }}>
              {result.overall < 45
                ? "Fill in more fields to improve"
                : result.overall < 70
                ? "Getting there — check the tips below"
                : "Your story is well optimized!"}
            </p>
          </div>
        </div>

        {/* Category bars with expandable item lists */}
        <div className="space-y-3">
          {result.categories.map((cat) => (
            <div key={cat.label}>
              <button
                type="button"
                className="w-full flex items-center gap-2"
                onClick={() => setExpanded(expanded === cat.label ? null : cat.label)}
              >
                <span className="text-xs font-medium w-[68px] text-left" style={{ color: "var(--foreground)" }}>
                  {cat.label}
                </span>
                <ScoreBar score={cat.score} color={cat.color} />
                <span className="text-xs font-bold w-7 text-right tabular-nums" style={{ color: cat.color }}>
                  {cat.score}
                </span>
                {expanded === cat.label
                  ? <ChevronUp size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                  : <ChevronDown size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />}
              </button>

              {expanded === cat.label && (
                <div
                  className="mt-3 pl-3 space-y-2.5"
                  style={{ borderLeft: `2px solid ${cat.color}44` }}
                >
                  {cat.items.map((item) => (
                    <ItemRow key={item.label} item={item} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Top tips */}
        {tips.length > 0 && (
          <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold mb-2.5" style={{ color: "var(--foreground)" }}>
              Top improvements
            </p>
            <div className="space-y-2.5">
              {tips.map((tip, i) => (
                <div key={`${tip.label}-${i}`} className="flex items-start gap-2">
                  <StatusIcon status={tip.status} />
                  <p className="text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>
                    <span style={{ color: "var(--foreground)" }}>{tip.label}:</span>{" "}
                    {tip.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

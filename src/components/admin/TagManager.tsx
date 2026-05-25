"use client";

import { useState } from "react";
import { Edit2, Trash2, Check, X, Tag } from "lucide-react";

interface TagEntry { name: string; count: number; }

const INPUT: React.CSSProperties = {
  background: "var(--background)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  outline: "none",
};

export function TagManager({ initial }: { initial: TagEntry[] }) {
  const [tags, setTags] = useState<TagEntry[]>(initial);
  const [renamingTag, setRenamingTag] = useState<string | null>(null);
  const [renameTo, setRenameTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startRename(name: string) {
    setRenamingTag(name);
    setRenameTo(name);
    setError("");
  }

  async function handleRename(from: string) {
    const to = renameTo.trim();
    if (!to || to === from) { setRenamingTag(null); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/tags/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Rename failed"); return; }

    setTags((prev) => {
      const fromEntry = prev.find((t) => t.name === from);
      const toEntry = prev.find((t) => t.name === to);
      if (toEntry && fromEntry) {
        return prev
          .filter((t) => t.name !== from)
          .map((t) => (t.name === to ? { ...t, count: t.count + fromEntry.count } : t))
          .sort((a, b) => b.count - a.count);
      }
      return prev.map((t) => (t.name === from ? { ...t, name: to } : t)).sort((a, b) => b.count - a.count);
    });
    setRenamingTag(null);
  }

  async function handleDelete(tag: string, count: number) {
    const msg = count > 0
      ? `Remove "${tag}" from ${count} ${count === 1 ? "story" : "stories"}?`
      : `Delete tag "${tag}"?`;
    if (!confirm(msg)) return;
    setSaving(true); setError("");
    const res = await fetch("/api/admin/tags/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
    setTags((prev) => prev.filter((t) => t.name !== tag));
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start justify-between gap-3 p-3 rounded-xl text-sm"
          style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.3)" }}>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="shrink-0 opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {tags.length === 0 ? (
          <div className="p-10 text-center" style={{ color: "var(--muted-foreground)" }}>
            <Tag size={28} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tags yet. Tags appear here once added to stories.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[380px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Tag", "Stories", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider"
                      style={{ color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.name} className="hover:opacity-90 transition-opacity"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3">
                      {renamingTag === tag.name ? (
                        <input
                          type="text"
                          value={renameTo}
                          onChange={(e) => setRenameTo(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(tag.name);
                            if (e.key === "Escape") setRenamingTag(null);
                          }}
                          className="px-2 py-1 rounded-lg text-sm w-36"
                          style={INPUT}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.2)" }}
                        >
                          #{tag.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {tag.count} {tag.count === 1 ? "story" : "stories"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {renamingTag === tag.name ? (
                          <>
                            <button type="button" onClick={() => handleRename(tag.name)} disabled={saving}
                              className="p-1.5 rounded-lg transition-opacity hover:opacity-75" style={{ color: "#22c55e" }}>
                              <Check size={14} />
                            </button>
                            <button type="button" onClick={() => setRenamingTag(null)}
                              className="p-1.5 rounded-lg transition-opacity hover:opacity-75" style={{ color: "var(--muted-foreground)" }}>
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => startRename(tag.name)}
                              className="p-1.5 rounded-lg transition-opacity hover:opacity-75" style={{ color: "#c4426a" }}>
                              <Edit2 size={14} />
                            </button>
                            <button type="button" onClick={() => handleDelete(tag.name, tag.count)}
                              className="p-1.5 rounded-lg transition-opacity hover:opacity-75" style={{ color: "var(--muted-foreground)" }}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

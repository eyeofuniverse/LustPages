"use client";

import React, { useState, useMemo } from "react";
import { Plus, Trash2, Search, Key } from "lucide-react";
import { TagSearchPicker } from "./TagSearchPicker";

interface TagRef { id: string; name: string; slug: string; }
interface KeywordRule {
  id: string;
  keyword: string;
  parentTagId: string;
  parentTag: TagRef;
}
interface AdminTagOption { id: string; name: string; slug: string; tier: number; description: string | null; isApproved: boolean; _count: { stories: number }; aliases: { id: string; alias: string }[]; parentRelations: unknown[]; childRelations: unknown[]; }

interface Props {
  initialRules: KeywordRule[];
  tags: AdminTagOption[];
}

export function TagKeywordRulesManager({ initialRules, tags }: Props) {
  const [rules, setRules] = useState(initialRules);
  const [search, setSearch] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter((r) => r.keyword.includes(q) || r.parentTag.name.toLowerCase().includes(q));
  }, [rules, search]);

  // Live preview: which existing tags would match the new keyword
  const preview = useMemo(() => {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw) return [];
    return tags.filter((t) => t.isApproved && t.name.toLowerCase().includes(kw));
  }, [newKeyword, tags]);

  async function handleAdd() {
    if (!newKeyword.trim() || !newParentId) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/tag-keyword-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword.trim(), parentTagId: newParentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setRules((prev) => [...prev, data.rule].sort((a, b) => a.keyword.localeCompare(b.keyword)));
        setNewKeyword("");
        setNewParentId("");
        if (data.applied > 0) {
          alert(`Rule created and applied retroactively to ${data.applied} existing tag${data.applied !== 1 ? "s" : ""}.`);
        }
      } else {
        alert(data.error ?? "Error creating rule");
      }
    } catch {
      alert("Network error — please try again");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(rule: KeywordRule) {
    if (!confirm(`Delete rule "${rule.keyword}" → "${rule.parentTag.name}"?\n\nExisting relationships created by this rule are NOT removed automatically.`)) return;
    const res = await fetch(`/api/admin/tag-keyword-rules/${rule.id}`, { method: "DELETE" });
    if (res.ok) setRules((prev) => prev.filter((r) => r.id !== rule.id));
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--muted)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    borderRadius: "10px",
    fontSize: "13px",
    padding: "6px 10px",
    outline: "none",
  };

  return (
    <div>
      {/* Add rule form */}
      <div
        className="p-4 rounded-2xl mb-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Add Keyword Rule</p>
        <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
          Any tag whose name contains this keyword will automatically become a child of the selected parent tag — including future tags.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Keyword (e.g. transgender, wife, bdsm)…"
            style={{ ...inputStyle, flex: 1 }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
          />
          <div className="flex-1">
            <TagSearchPicker
              options={tags}
              excludeId=""
              value={newParentId}
              onChange={setNewParentId}
              placeholder="Parent tag…"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !newKeyword.trim() || !newParentId}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 shrink-0"
            style={{ background: "#c4426a" }}
          >
            {adding ? "Adding…" : <><Plus size={14} /> Add Rule</>}
          </button>
        </div>

        {/* Live preview of matching tags */}
        {newKeyword.trim() && (
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
          >
            {preview.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                No existing approved tags match &ldquo;{newKeyword.trim()}&rdquo;
              </p>
            ) : (
              <>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
                  {preview.length} existing tag{preview.length !== 1 ? "s" : ""} will be assigned this parent retroactively:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.slice(0, 30).map((t) => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.25)" }}
                    >
                      {t.name}
                    </span>
                  ))}
                  {preview.length > 30 && (
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>+{preview.length - 30} more</span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter rules…"
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
        />
      </div>

      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        {filtered.length} of {rules.length} rules
      </p>

      {/* Rules table */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-12 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Key size={28} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
          <p style={{ color: "var(--muted-foreground)" }}>
            {rules.length === 0 ? "No rules yet — add one above." : "No rules match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((rule) => {
            const matchCount = tags.filter((t) => t.isApproved && t.name.toLowerCase().includes(rule.keyword)).length;
            return (
              <div
                key={rule.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <Key size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
                <code
                  className="text-sm font-mono px-2 py-0.5 rounded"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
                >
                  {rule.keyword}
                </code>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>→</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)" }}
                >
                  {rule.parentTag.name}
                </span>
                <span className="flex-1" />
                <span className="text-xs shrink-0" style={{ color: "var(--muted-foreground)" }}>
                  {matchCount} matching tag{matchCount !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => handleDelete(rule)}
                  className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
                  title="Delete rule"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

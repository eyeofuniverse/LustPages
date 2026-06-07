"use client";

import { useState, useRef } from "react";
import { Plus, X, Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Download } from "lucide-react";

type SynonymType = "TOKEN" | "PHRASE";

interface SynonymRow {
  id: string;
  term: string;
  type: SynonymType;
  synonyms: string[];
  isActive: boolean;
  createdAt: string;
}

export function SearchSynonymsManager({ initial }: { initial: SynonymRow[] }) {
  const [rows, setRows]         = useState<SynonymRow[]>(initial);
  const [expandedId, setExpanded] = useState<string | null>(null);
  const [newTerm, setNewTerm]   = useState("");
  const [newType, setNewType]   = useState<SynonymType>("TOKEN");
  const [newSyns, setNewSyns]   = useState("");
  const [addErr, setAddErr]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [seeding, setSeeding]   = useState(false);
  const [seedMsg, setSeedMsg]   = useState("");
  const [filter, setFilter]     = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // ── filtered list ──────────────────────────────────────────────────────────
  const visible = filter
    ? rows.filter((r) => r.term.includes(filter.toLowerCase().replace(/\s+/g, "")) ||
        r.synonyms.some((s) => s.toLowerCase().includes(filter.toLowerCase())))
    : rows;

  // ── add new group ──────────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddErr("");
    const synonyms = newSyns.split(",").map((s) => s.trim()).filter(Boolean);
    if (!newTerm.trim()) { setAddErr("Term is required"); return; }
    if (synonyms.length === 0) { setAddErr("Add at least one synonym"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/search-synonyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: newTerm, type: newType, synonyms }),
      });
      const data = await res.json();
      if (!res.ok) { setAddErr(data.error ?? "Failed"); return; }
      setRows((prev) => [data, ...prev]);
      setNewTerm(""); setNewSyns(""); setNewType("TOKEN");
    } finally {
      setSaving(false);
    }
  }

  // ── add synonym to existing group ──────────────────────────────────────────
  async function addSynonym(row: SynonymRow, synonym: string) {
    const trimmed = synonym.trim();
    if (!trimmed || row.synonyms.includes(trimmed)) return;
    const updated = [...row.synonyms, trimmed];
    const res = await fetch(`/api/admin/search-synonyms/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ synonyms: updated }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setRows((prev) => prev.map((r) => r.id === row.id ? data : r));
  }

  // ── remove synonym from group ──────────────────────────────────────────────
  async function removeSynonym(row: SynonymRow, syn: string) {
    const updated = row.synonyms.filter((s) => s !== syn);
    const res = await fetch(`/api/admin/search-synonyms/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ synonyms: updated }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setRows((prev) => prev.map((r) => r.id === row.id ? data : r));
  }

  // ── toggle active ──────────────────────────────────────────────────────────
  async function toggleActive(row: SynonymRow) {
    const res = await fetch(`/api/admin/search-synonyms/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setRows((prev) => prev.map((r) => r.id === row.id ? data : r));
  }

  // ── delete group ───────────────────────────────────────────────────────────
  async function deleteRow(id: string) {
    if (!confirm("Delete this synonym group?")) return;
    const res = await fetch(`/api/admin/search-synonyms/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (expandedId === id) setExpanded(null);
  }

  // ── seed defaults ──────────────────────────────────────────────────────────
  async function handleSeed() {
    setSeeding(true); setSeedMsg("");
    try {
      const res = await fetch("/api/admin/search-synonyms/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setSeedMsg("Seed failed: " + (data.error ?? "unknown")); return; }
      setSeedMsg(`Imported ${data.created} groups (${data.skipped} already existed). Refresh to see them.`);
    } finally {
      setSeeding(false);
    }
  }

  // ── inline edit input ──────────────────────────────────────────────────────
  function EditInput({ row }: { row: SynonymRow }) {
    const [val, setVal] = useState("");
    return (
      <form
        className="flex gap-2 mt-3"
        onSubmit={(e) => { e.preventDefault(); addSynonym(row, val); setVal(""); }}
      >
        <input
          ref={editInputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Add synonym…"
          className="flex-1 px-3 py-1.5 rounded-lg text-sm"
          style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        />
        <button
          type="submit"
          disabled={!val.trim()}
          className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
          style={{ background: "#6366f1", color: "#fff" }}
        >
          Add
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── header actions ── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by term or synonym…"
          className="flex-1 min-w-48 px-3 py-2 rounded-xl text-sm"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        />
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        >
          <Download size={14} />
          {seeding ? "Importing…" : "Import Defaults"}
        </button>
      </div>

      {seedMsg && (
        <p className="text-sm px-4 py-2 rounded-xl" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
          {seedMsg}
        </p>
      )}

      {/* ── add new group form ── */}
      <div className="p-4 rounded-2xl space-y-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Add New Synonym Group</p>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <input
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Term (e.g. wife, gangbang, wifegangbang)"
              className="flex-1 min-w-48 px-3 py-2 rounded-xl text-sm"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as SynonymType)}
              className="px-3 py-2 rounded-xl text-sm"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              <option value="TOKEN">TOKEN — single word expands when found in query</option>
              <option value="PHRASE">PHRASE — full query must match to expand</option>
            </select>
          </div>
          <input
            value={newSyns}
            onChange={(e) => setNewSyns(e.target.value)}
            placeholder="Synonyms, comma-separated (e.g. married woman, spouse, hotwife, housewife)"
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
          {addErr && <p className="text-sm" style={{ color: "#ef4444" }}>{addErr}</p>}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ background: "#6366f1", color: "#fff" }}
          >
            <Plus size={14} />
            {saving ? "Saving…" : "Add Group"}
          </button>
        </form>

        {/* type explanation */}
        <div className="text-xs space-y-0.5 pt-1" style={{ color: "var(--muted-foreground)" }}>
          <p><strong>TOKEN:</strong> use for single words. Searching &quot;wife&quot; also searches all synonyms.</p>
          <p><strong>PHRASE:</strong> use for multi-word concepts. The term must match the full compacted query (e.g. &quot;wifegangbang&quot; for query &quot;wife gangbang&quot;).</p>
        </div>
      </div>

      {/* ── rows ── */}
      <div className="space-y-2">
        {visible.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: "var(--muted-foreground)" }}>
            No synonym groups yet. Click &quot;Import Defaults&quot; to load built-in synonyms.
          </p>
        )}
        {visible.map((row) => {
          const isOpen = expandedId === row.id;
          return (
            <div
              key={row.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                opacity: row.isActive ? 1 : 0.55,
              }}
            >
              {/* row header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setExpanded(isOpen ? null : row.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  {isOpen ? <ChevronUp size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                          : <ChevronDown size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />}
                  <code
                    className="text-sm font-mono font-semibold"
                    style={{ color: "#6366f1" }}
                  >
                    {row.term}
                  </code>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: row.type === "TOKEN" ? "rgba(34,197,94,0.12)" : "rgba(249,115,22,0.12)",
                      color:      row.type === "TOKEN" ? "#22c55e"              : "#f97316",
                    }}
                  >
                    {row.type}
                  </span>
                  <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                    {row.synonyms.slice(0, 4).join(", ")}
                    {row.synonyms.length > 4 ? ` +${row.synonyms.length - 4} more` : ""}
                  </span>
                </button>

                {/* active toggle */}
                <button
                  onClick={() => toggleActive(row)}
                  title={row.isActive ? "Disable" : "Enable"}
                  style={{ color: row.isActive ? "#22c55e" : "var(--muted-foreground)" }}
                >
                  {row.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>

                {/* delete */}
                <button
                  onClick={() => deleteRow(row.id)}
                  title="Delete group"
                  style={{ color: "var(--muted-foreground)" }}
                  className="hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* expanded edit panel */}
              {isOpen && (
                <div
                  className="px-4 pb-4 space-y-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <p className="text-xs pt-3 font-medium" style={{ color: "var(--muted-foreground)" }}>
                    Synonyms — click × to remove
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {row.synonyms.map((syn) => (
                      <span
                        key={syn}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}
                      >
                        {syn}
                        <button
                          onClick={() => removeSynonym(row, syn)}
                          className="ml-0.5 opacity-60 hover:opacity-100"
                          title="Remove"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <EditInput row={row} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

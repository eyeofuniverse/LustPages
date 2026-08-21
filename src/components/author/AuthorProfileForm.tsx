"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

interface Props {
  initialData: {
    name: string;
    bio: string;
    image: string;
    website: string;
    slug: string;
  };
}

export function AuthorProfileForm({ initialData }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialData.name);
  const [bio, setBio] = useState(initialData.bio);
  const [image, setImage] = useState(initialData.image);
  const [website, setWebsite] = useState(initialData.website);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/author/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, image, website }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save profile.");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    color: "var(--foreground)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Public profile link */}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
        style={{ background: "rgba(196,66,106,0.06)", border: "1px solid rgba(196,66,106,0.2)", color: "var(--muted-foreground)" }}
      >
        <span>Public profile:</span>
        <a
          href={`/authors/${initialData.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-medium hover:opacity-75 transition-opacity"
          style={{ color: "#c4426a" }}
        >
          /authors/{initialData.slug}
          <ExternalLink size={12} />
        </a>
      </div>

      <div>
        <label style={labelStyle}>Display Name <span style={{ color: "#c4426a" }}>*</span></label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
          style={inputStyle}
        />
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          Shown on your public profile and all your stories.
        </p>
      </div>

      <div>
        <label style={labelStyle}>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={1000}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" as const }}
          placeholder="Tell readers about yourself…"
        />
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          {bio.length}/1000 characters
        </p>
      </div>

      <div>
        <label style={labelStyle}>Avatar URL</label>
        <input
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          style={inputStyle}
          placeholder="https://example.com/your-photo.jpg"
        />
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          Link to an image hosted elsewhere (e.g. Imgur, Cloudinary).
        </p>
      </div>

      <div>
        <label style={labelStyle}>Website</label>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={inputStyle}
          placeholder="https://yoursite.com"
        />
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(34,197,94,0.08)", color: "#16a34a" }}>
          Profile saved successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "#c4426a" }}
      >
        {saving ? "Saving…" : "Save Profile"}
      </button>
    </form>
  );
}

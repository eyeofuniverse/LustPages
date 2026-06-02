"use client";

import { useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";

interface CoverImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  signUrl?: string;
}

export function CoverImageUpload({ value, onChange, signUrl = "/api/admin/upload/sign" }: CoverImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const signRes = await fetch(signUrl, { method: "POST" });
      if (!signRes.ok) throw new Error("Failed to get upload signature.");
      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("folder", folder);

      const upRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: form }
      );
      if (!upRes.ok) throw new Error("Upload failed.");

      const data = await upRes.json();
      onChange(data.secure_url as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const spinner = (light = false) => (
    <div
      className="w-6 h-6 rounded-full animate-spin"
      style={{
        border: light ? "2px solid rgba(255,255,255,0.3)" : "2px solid rgba(0,0,0,0.15)",
        borderTopColor: light ? "white" : "var(--foreground)",
      }}
    />
  );

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {value ? (
        <div className="relative rounded-xl overflow-hidden group" style={{ aspectRatio: "2/3", maxWidth: 200 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Cover"
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <div
            className="absolute inset-0 flex items-center justify-center gap-2 transition-opacity opacity-0 group-hover:opacity-100"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity"
              style={{ background: "rgba(0,0,0,0.7)" }}
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={uploading}
              className="p-1.5 rounded-lg text-white"
              style={{ background: "rgba(196,66,106,0.85)" }}
            >
              <X size={14} />
            </button>
          </div>
          {uploading && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              {spinner(true)}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          disabled={uploading}
          className="rounded-xl flex flex-col items-center justify-center gap-2 transition-colors hover:opacity-80 disabled:opacity-60"
          style={{
            aspectRatio: "2/3",
            width: "100%",
            maxWidth: 200,
            border: "2px dashed var(--border)",
            background: "var(--muted)",
            color: "var(--muted-foreground)",
          }}
        >
          {uploading ? (
            spinner()
          ) : (
            <>
              <ImageIcon size={24} style={{ opacity: 0.45 }} />
              <span className="text-xs font-medium text-center px-2">Upload cover</span>
              <span className="text-[10px] text-center px-2" style={{ opacity: 0.6 }}>JPG, PNG, WEBP · 10 MB max</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-1.5 text-xs" style={{ color: "#ef4444" }}>{error}</p>
      )}
    </div>
  );
}

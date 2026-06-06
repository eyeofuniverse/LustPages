"use client";
import { useEffect } from "react";

export function ViewTracker({ storyId }: { storyId: string }) {
  useEffect(() => {
    fetch(`/api/stories/${storyId}/view`, { method: "POST" });
  }, [storyId]);

  return null;
}

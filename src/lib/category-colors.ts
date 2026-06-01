const PALETTE = [
  "#e74c3c", "#e67e22", "#f1c40f", "#27ae60", "#1abc9c",
  "#3498db", "#9b59b6", "#e91e63", "#ff5722", "#00bcd4",
  "#8bc34a", "#ff9800", "#607d8b", "#795548", "#f06292",
  "#4caf50", "#2196f3", "#9c27b0", "#ff6f00", "#00acc1",
  "#d81b60", "#6d4c41", "#43a047", "#1e88e5", "#8e24aa",
];

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function pickUniqueColor(usedColors: string[]): string {
  const used = new Set(usedColors.map((c) => c.toLowerCase()));
  const free = PALETTE.find((c) => !used.has(c));
  if (free) return free;
  // Palette exhausted — generate a random hue not visually close to any used color
  for (let attempt = 0; attempt < 20; attempt++) {
    const hue = Math.floor(Math.random() * 360);
    const candidate = hslToHex(hue, 65, 50);
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
  return hslToHex(Math.floor(Math.random() * 360), 65, 50);
}

const KEY = "8bb1fb4104ef4d268bfca97bcc53076e";
const HOST = "lustpages.com";
const BASE = "https://lustpages.com";

export function storyUrl(slug: string) {
  return `${BASE}/stories/${slug}`;
}

export function seriesUrl(slug: string) {
  return `${BASE}/series/${slug}`;
}

export function submitToIndexNow(urls: string[]): void {
  if (!urls.length) return;
  fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `${BASE}/${KEY}.txt`,
      urlList: urls.slice(0, 10000),
    }),
  }).catch(() => {});
}

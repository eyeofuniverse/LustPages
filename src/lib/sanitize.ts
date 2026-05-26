import sanitizeHtml from "sanitize-html";

// Exact set of tags TipTap's StarterKit + Underline + TextAlign can produce.
// Anything outside this list is stripped entirely.
const ALLOWED_TAGS = [
  "p", "strong", "em", "u", "s", "code", "pre",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "hr", "br",
];

export function sanitizeStoryContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      // TextAlign injects style="text-align: ..." on block elements.
      p:  ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      h5: ["style"],
      h6: ["style"],
    },
    allowedStyles: {
      "*": {
        // Only permit text-align with safe keyword values — nothing else.
        "text-align": [/^(left|center|right|justify)$/],
      },
    },
    // Strip disallowed tags completely (don't leave their inner text).
    disallowedTagsMode: "discard",
  });
}

/**
 * Author-friendly colour + highlight syntax that works in every block:
 *   {{red|text}}        → coloured text
 *   {{#ff8800|text}}    → coloured text (hex)
 *   {{bg:yellow|text}}  → highlighted background
 *   ==text==            → marker highlight
 */
const SAFE_COLOR = /^(?:#[0-9a-f]{3,8}|[a-z]+(?:\s*\([\d\s.,%/-]+\))?)$/i;

function esc(value: string) {
  return value.replace(/"/g, "&quot;");
}

export function colorizeMarkdown(input: string): string {
  return input
    .replace(/\{\{\s*([^|{}]+?)\s*\|([\s\S]*?)\}\}/g, (full, rawColor: string, text: string) => {
      const bg = /^bg\s*:/i.test(rawColor);
      const color = rawColor.replace(/^bg\s*:/i, "").trim();
      if (!SAFE_COLOR.test(color)) return full;
      const style = bg
        ? `background-color:${color};padding:0.05em 0.3em;border-radius:0.25em`
        : `color:${color}`;
      return `<span style="${esc(style)}">${text}</span>`;
    })
    .replace(/==([^=\n]+)==/g, "<mark>$1</mark>");
}

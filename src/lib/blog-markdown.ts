/**
 * Expands author-friendly markdown extensions into sanitized HTML wrappers so
 * they render as designed instead of leaking raw syntax:
 *   > [!NOTE] / TIP / IMPORTANT / WARNING / SUCCESS / QUOTE  → styled alert card
 *   :::columns … :::  (consecutive groups merge into one grid)  → responsive columns
 */
const ALERT_LABELS: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
  danger: "Danger",
  success: "Success",
  quote: "Quote",
  info: "Info",
};

function trimBlank(lines: string[]) {
  const copy = [...lines];
  while (copy.length && !copy[0]?.trim()) copy.shift();
  while (copy.length && !copy[copy.length - 1]?.trim()) copy.pop();
  return copy;
}

const isColumnOpen = (line: string) => /^\s*:{3,}\s*col(?:umn)?s?\s*$/i.test(line);
const isFenceClose = (line: string) => /^\s*:{3,}\s*$/.test(line);

export function expandBlogSyntax(input: string): string {
  const lines = input.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let inCodeFence = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      out.push(line);
      i += 1;
      continue;
    }
    if (inCodeFence) {
      out.push(line);
      i += 1;
      continue;
    }

    if (isColumnOpen(line)) {
      const cells: string[][] = [];
      while (i < lines.length && isColumnOpen(lines[i] ?? "")) {
        i += 1;
        const cell: string[] = [];
        while (i < lines.length && !isFenceClose(lines[i] ?? "")) {
          cell.push(lines[i] ?? "");
          i += 1;
        }
        i += 1; // consume closing :::
        cells.push(trimBlank(cell));
        // merge the next column group even when blank lines separate them
        let peek = i;
        while (peek < lines.length && !(lines[peek] ?? "").trim()) peek += 1;
        if (isColumnOpen(lines[peek] ?? "")) i = peek;
      }
      out.push("", `<div class="blog-cols" data-cols="${cells.length}">`);
      for (const cell of cells) {
        out.push('<div class="blog-col">', "", ...cell, "", "</div>");
      }
      out.push("</div>", "");
      continue;
    }

    const alert = /^\s*>\s*\[!(\w+)\]\s*(.*)$/.exec(line);
    if (alert) {
      const kind = (alert[1] ?? "note").toLowerCase();
      const body: string[] = [];
      const trailing = (alert[2] ?? "").trim();
      if (trailing) body.push(trailing);
      i += 1;
      while (i < lines.length && /^\s*>/.test(lines[i] ?? "")) {
        body.push((lines[i] ?? "").replace(/^\s*>\s?/, ""));
        i += 1;
      }
      const label = ALERT_LABELS[kind] ?? kind.toUpperCase();
      out.push(
        "",
        `<div class="blog-alert" data-kind="${kind}">`,
        `<p class="blog-alert-label">${label}</p>`,
        "",
        ...trimBlank(body),
        "",
        "</div>",
        "",
      );
      continue;
    }

    out.push(line);
    i += 1;
  }

  return out.join("\n");
}

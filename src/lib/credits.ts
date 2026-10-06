export type CreditRow =
  | { kind: "field"; label: string | null; value: string }
  | { kind: "break" };

const LABEL_PATTERN = /^[A-Za-z][A-Za-z /&'-]*$/;
export const SUPPORT_PATTERN = /^with the support of\b[:\s]*/i;

export function splitField(
  line: string,
): { label: string; value: string } | null {
  const separator = line.indexOf(":");
  if (separator <= 0) {
    return null;
  }

  const label = line.slice(0, separator).trim();
  const value = line.slice(separator + 1).trim();

  if (!value || label.length > 28 || !LABEL_PATTERN.test(label)) {
    return null;
  }

  return { label, value };
}

export function toLines(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim());
}

export function parseCredits(text: string): CreditRow[] {
  const rows: CreditRow[] = [];

  for (const line of toLines(text)) {
    if (!line) {
      if (rows.length > 0 && rows[rows.length - 1].kind !== "break") {
        rows.push({ kind: "break" });
      }
      continue;
    }

    const field = splitField(line);
    rows.push({
      kind: "field",
      label: field ? field.label : null,
      value: field ? field.value : line,
    });
  }

  while (rows.length > 0 && rows[rows.length - 1].kind === "break") {
    rows.pop();
  }

  return rows;
}

export function parseBlocks(text: string): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of toLines(text)) {
    if (!line) {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
      continue;
    }
    current.push(line);
  }

  if (current.length > 0) {
    blocks.push(current);
  }

  return blocks;
}

import { Fragment } from "react";
import type { Film } from "@/data/types";
import { cn } from "@/lib/utils";

type CreditRow =
  | { kind: "field"; label: string | null; value: string }
  | { kind: "break" };

const LABEL_CLASS =
  "text-[9px] font-medium uppercase leading-[13px] tracking-[0.09em] opacity-75";

const LABEL_PATTERN = /^[A-Za-z][A-Za-z /&'-]*$/;
const SUPPORT_PATTERN = /^with the support of\b[:\s]*/i;

function splitField(line: string): { label: string; value: string } | null {
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

function toLines(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim());
}

function parseCredits(text: string): CreditRow[] {
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

function parseBlocks(text: string): string[][] {
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

function CreditField({ label, lines }: { label: string; lines: string[] }) {
  return (
    <>
      <dt className={LABEL_CLASS}>{label}</dt>
      <dd className="leading-[13px]">
        {lines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </dd>
    </>
  );
}

function CreditColumn({ text }: { text: string }) {
  const rows = parseCredits(text);

  if (rows.length === 0) {
    return null;
  }

  const hasLabels = rows.some(
    (row) => row.kind === "field" && row.label !== null,
  );

  if (hasLabels) {
    return (
      <dl className="grid grid-cols-[max-content_1fr] items-baseline gap-x-3.5">
        {rows.map((row, index) => {
          if (row.kind === "break") {
            return <div key={index} aria-hidden className="col-span-2 h-2.5" />;
          }

          return (
            <Fragment key={index}>
              <dt className={LABEL_CLASS}>{row.label}</dt>
              <dd className="leading-[13px]">{row.value}</dd>
            </Fragment>
          );
        })}
      </dl>
    );
  }

  const blocks = parseBlocks(text);
  const hasSupport =
    blocks.length > 0 && SUPPORT_PATTERN.test(blocks[0][0] ?? "");

  if (!hasSupport) {
    return (
      <>
        {blocks.map((block, index) => (
          <p key={index} className={index > 0 ? "mt-3" : undefined}>
            {block.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </p>
        ))}
      </>
    );
  }

  const support: string[] = [];
  const screenings: string[] = [];

  blocks.forEach((block, blockIndex) => {
    if (blockIndex === 0) {
      block.forEach((line, lineIndex) => {
        const value =
          lineIndex === 0 ? line.replace(SUPPORT_PATTERN, "") : line;
        if (value) {
          support.push(value);
        }
      });
    } else {
      screenings.push(...block);
    }
  });

  return (
    <dl className="grid grid-cols-[max-content_1fr] items-baseline gap-x-3.5">
      {support.length > 0 ? (
        <CreditField label="Support" lines={support} />
      ) : null}
      {screenings.length > 0 ? (
        <CreditField label="Screenings" lines={screenings} />
      ) : null}
    </dl>
  );
}

export function CreditsContent({
  film,
  className,
}: {
  film: Film;
  className?: string;
}) {
  const left = film.credits.left.trim();
  const right = film.credits.right.trim();

  if (!left && !right) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-5 px-[32px] text-[11px] leading-[13px] text-ink",
        "max-md:grid-cols-1 max-md:text-xs max-md:leading-[15px]",
        className,
      )}
    >
      <div
        className={cn(
          "col-span-3 col-start-3 grid grid-cols-2 gap-x-[24px]",
          "max-md:col-span-1 max-md:col-start-1 max-md:grid-cols-1 max-md:gap-y-5",
        )}
      >
        {left ? (
          <div>
            <CreditColumn text={left} />
          </div>
        ) : null}
        {right ? (
          <div>
            <CreditColumn text={right} />
          </div>
        ) : null}
      </div>
    </div>
  );
}



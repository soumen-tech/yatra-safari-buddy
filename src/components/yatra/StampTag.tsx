import type { ReactNode } from "react";

export function StampTag({
  children,
  tone = "mustard",
}: {
  children: ReactNode;
  tone?: "mustard" | "pink" | "dusk";
}) {
  const bg =
    tone === "pink"
      ? "bg-[var(--hotpink)] text-[var(--cream)]"
      : tone === "dusk"
        ? "bg-[var(--dusk)] text-[var(--mustard)]"
        : "bg-[var(--mustard)] text-[var(--ink)]";
  return <span className={`chip ${bg}`}>{children}</span>;
}

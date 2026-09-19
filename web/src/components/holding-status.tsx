"use client";
import { useUi } from "./language-provider";

export function HoldingStatus({ status }: { status?: "held" | null }) {
  const ui = useUi();
  return <span className="holding-badge" data-held={status === "held"} title={ui("holdings_definition")}>
    {ui(status === "held" ? "holding_held" : "holding_not_held")}
  </span>;
}

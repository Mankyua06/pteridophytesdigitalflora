"use client";
import { useUi } from "@/components/language-provider";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const ui = useUi();
  return (
    <div className="empty" role="alert">
      <h1>{ui("unable_to_load_data")}</h1>
      <button onClick={reset}>{ui("try_again")}</button>
    </div>
  );
}

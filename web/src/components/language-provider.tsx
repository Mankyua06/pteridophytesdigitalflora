"use client";

import { createContext, useContext, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { translator, type Locale, type SiteText } from "@/lib/site-text";

type LanguageState = { locale: Locale; source: SiteText };
const LanguageContext = createContext<LanguageState | null>(null);
export function LanguageProvider({ locale, source, children }: { locale: Locale; source: SiteText; children: React.ReactNode }) {
  return <LanguageContext.Provider value={{locale, source}}>{children}</LanguageContext.Provider>;
}
export function useUi() {
  const state = useContext(LanguageContext);
  if (!state) throw new Error("LanguageProvider is missing");
  return useMemo(() => translator(state.locale, state.source), [state]);
}
export function LanguageSwitch() {
  const state = useContext(LanguageContext);
  if (!state) throw new Error("LanguageProvider is missing");
  const {locale} = state;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const ui = useUi();
  return <button className="language-switch" disabled={pending} aria-label={ui("switch_language")} onClick={() => {
    const next = locale === "en" ? "ko" : "en";
    document.cookie = `fern-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    startTransition(() => router.refresh());
  }}><span lang={locale === "en" ? "ko" : "en"}>{locale === "en" ? "한국어" : "English"}</span></button>;
}

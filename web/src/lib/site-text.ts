import content from "../../public/data/site-text.json";

export type Locale = "en" | "ko";
export type Translator = (key: string, values?: Record<string, string | number>) => string;
export type SiteText = { text: Record<string, string>; text_ko?: Record<string, string> };
/** Plain text only. A missing Korean translation falls back to the English copy. */
export function translator(locale: Locale, source: SiteText = content): Translator {
  return (key, values = {}) => {
    const text = (locale === "ko" && source.text_ko?.[key]?.trim() ? source.text_ko[key] : source.text[key]);
    if (text === undefined) throw new Error(`Missing site text: ${key}`);
    return text.replace(/\{(\w+)\}/g, (token, name: string) =>
      Object.hasOwn(values, name) ? String(values[name]) : token,
    );
  };
}
// Default for non-UI diagnostic errors. Rendered UI uses getUi/useUi.
export const ui = translator("en");

import type { CSSProperties } from "react";

const fonts: Record<string, string> = {
  system: 'Arial, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
  sans: 'Verdana, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
  serif: 'Georgia, "AppleMyungjo", "Batang", serif',
};
const colors: Record<string, string> = {
  background_color: "--paper", text_color: "--ink", muted_color: "--muted",
  border_color: "--line", accent_color: "--green", surface_color: "--pale",
};
export function themeStyle(theme: Record<string, string> = {}): CSSProperties {
  const style: Record<string, string> = {};
  for (const [key, variable] of Object.entries(colors)) {
    if (/^#[0-9a-fA-F]{6}$/.test(theme[key] || "")) style[variable] = theme[key];
  }
  for (const key of ["body_font", "heading_font"]) {
    if (Object.hasOwn(fonts, theme[key])) style[`--${key.replaceAll("_", "-")}`] = fonts[theme[key]];
  }
  for (const [key, low, high] of [["base_font_size", 12, 24], ["heading_font_size", 24, 72]] as const) {
    const value = Number(theme[key]);
    if (Number.isInteger(value) && value >= low && value <= high) style[`--${key.replaceAll("_", "-")}`] = `${value}px`;
  }
  return style as CSSProperties;
}

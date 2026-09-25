import { test } from "node:test";
import assert from "node:assert/strict";
import { themeStyle } from "../src/lib/site-theme";

test("validated theme settings map to shared CSS variables", () => {
  const style = themeStyle({accent_color: "#123456", body_font: "serif", base_font_size: "20"});
  assert.equal((style as Record<string, string>)["--green"], "#123456");
  assert.equal((style as Record<string, string>)["--base-font-size"], "20px");
  assert.match((style as Record<string, string>)["--body-font"], /Batang/);
  assert.deepEqual(themeStyle({accent_color: "red;display:none", body_font: "unknown", base_font_size: "900"}), {});
});

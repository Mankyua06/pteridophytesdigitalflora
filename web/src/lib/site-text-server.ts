import "server-only";
import { cookies } from "next/headers";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { translator, type Locale, type SiteText } from "./site-text";

export const getSiteText = cache(async (): Promise<SiteText> =>
  JSON.parse(
    await readFile(
      path.join(process.cwd(), "public/data/site-text.json"),
      "utf8",
    ),
  ) as SiteText,
);

export const getLocale = cache(async (): Promise<Locale> =>
  (await cookies()).get("fern-language")?.value === "ko" ? "ko" : "en",
);
export const getUi = cache(async () =>
  translator(await getLocale(), await getSiteText()),
);

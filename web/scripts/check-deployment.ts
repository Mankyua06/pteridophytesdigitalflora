import { imageUrl } from "../src/lib/image-url";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
async function main() {
  if (!imageUrl("IM000001", "thumb"))
    throw Error(
      "NEXT_PUBLIC_SUPABASE_URL is required for deployment verification",
    );
  const release = JSON.parse(readFileSync("public/data/release.json", "utf8"));
  const manifest = JSON.parse(
    readFileSync("public/data/image-manifest.json", "utf8"),
  );
  for (const [id, variants] of Object.entries(manifest.images)) {
    for (const [size, info] of Object.entries(
      variants as Record<string, { sha256: string }>,
    )) {
      const response = await fetch(
        imageUrl(id, size as "thumb" | "medium" | "large")!,
        { signal: AbortSignal.timeout(60000) },
      );
      if (!response.ok) throw Error(`Remote image unavailable: ${id}/${size}`);
      const hash = createHash("sha256")
        .update(Buffer.from(await response.arrayBuffer()))
        .digest("hex");
      if (hash !== info.sha256)
        throw Error(`Remote content mismatch: ${id}/${size}`);
    }
  }
  console.log(`Deployment images verified for release ${release.release_id}`);
}
main().catch(() => {
  console.error(
    "Deployment check failed: verify public environment variables and remote image hashes.",
  );
  process.exitCode = 1;
});

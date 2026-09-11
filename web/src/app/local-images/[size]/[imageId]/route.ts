import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { validId } from "@/lib/image-url";
import type { ImageSize, Variant } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, {params}: {params: Promise<{size:string;imageId:string}>}) {
  // This route is unavailable in production and never serves originals.
  if (process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_LOCAL_PREVIEW !== "true")
    return new Response("Not found", {status:404});
  const {size,imageId}=await params;
  if(!["thumb","medium","large"].includes(size)||!validId(imageId))
    return new Response("Not found",{status:404});
  try {
    const manifest=JSON.parse(await readFile(path.join(process.cwd(),"public/data/image-manifest.json"),"utf8")) as {images:Record<string,Record<ImageSize,Variant>>};
    const entry=manifest.images[imageId]?.[size as ImageSize];
    if(!entry||entry.object_key!==`${size}/${imageId}.webp`)return new Response("Not found",{status:404});
    const root=await realpath(path.resolve(process.cwd(),"../images_web"));
    const file=await realpath(path.join(root,entry.object_key));
    if(!file.startsWith(root+path.sep))return new Response("Not found",{status:404});
    const bytes=await readFile(file);
    if(createHash("sha256").update(bytes).digest("hex")!==entry.sha256)
      return new Response("Image changed; rebuild public JSON",{status:409});
    return new Response(bytes,{headers:{"Content-Type":"image/webp","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  }catch {return new Response("Not found",{status:404});}
}

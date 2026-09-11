
import { ui } from "@/lib/site-text";
import type { ImageSize } from "./types";
export function validId(value: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_-]*$/.test(value);
}
export function imageUrl(
  imageId: string,
  size: ImageSize,
  base = process.env.NEXT_PUBLIC_SUPABASE_URL,
  bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "fern-images",
): string | null {
  if (!validId(imageId) || !["thumb", "medium", "large"].includes(size))
    throw new Error(ui("invalid_image_id_or_size"));
  if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_LOCAL_PREVIEW === "true")
    return `/local-images/${size}/${encodeURIComponent(imageId)}`;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(bucket))
    throw new Error(ui("invalid_bucket"));
  if (!base) return null;
  const url = new URL(base);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error(ui("supabase_url_must_be_an_https_origin"));
  return `${url.origin}/storage/v1/object/public/${encodeURIComponent(bucket)}/${size}/${encodeURIComponent(imageId)}.webp`;
}

"use client";
import { useUi } from "@/components/language-provider";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ImageSize, Photo } from "@/lib/types";
import { imageUrl } from "@/lib/image-url";

function PhotoImage({ photo, size }: { photo: Photo; size: ImageSize }) {
  const ui = useUi();
  const [failed, setFailed] = useState(false);
  let url: string | null = null;
  try {
    url = imageUrl(photo.image_id, size);
  } catch {
    /* Invalid configuration gets an explicit placeholder. */
  }
  if (!url || failed)
    return (
      <div
        className="photo-placeholder"
        role="img"
        aria-label={
          failed ? ui("unable_to_load_photograph") : ui("image_storage_configuration_required")
        }
      >
        <span aria-hidden>▧</span>
        <p>
          {failed ? ui("unable_to_load_photograph") : ui("image_storage_configuration_required")}
        </p>
      </div>
    );
  const variant = photo.variants[size];
  return (
    <Image
      unoptimized
      src={url}
      width={variant.width}
      height={variant.height}
      alt={photo.caption || ui("v0_photograph_v1", {v0: photo.taxon_id, v1: photo.image_id})}
      loading="lazy"
      sizes={size === "thumb" ? "(max-width: 640px) 100vw, 33vw" : "90vw"}
      onError={() => setFailed(true)}
    />
  );
}

export function Photos({ photos }: { photos: Photo[] }) {
  const ui = useUi();
  const [index, setIndex] = useState<number | null>(null);
  const [size, setSize] = useState<ImageSize>("medium");
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const open = index !== null;
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
    if (!open) trigger.current?.focus();
  }, [open]);
  if (!photos.length)
    return (
      <div className="empty">
        <h3>{ui("no_published_photographs")}</h3>
        <p>{ui("photographic_coverage_does_not_determine_structural_presence_con")}</p>
      </div>
    );
  const photo = index === null ? null : photos[index];
  const move = (delta: number) => {
    setIndex((i) =>
      i === null ? null : (i + delta + photos.length) % photos.length,
    );
    setSize("medium");
  };
  return (
    <>
      <div className="photo-grid">
        {photos.map((p, i) => (
          <figure key={p.image_id}>
            <button
              className="photo-button"
              aria-label={ui("view_photo_v0", {v0: p.image_id})}
              onClick={(e) => {
                trigger.current = e.currentTarget;
                setIndex(i);
                setSize("medium");
              }}
            >
              <PhotoImage key={p.image_id} photo={p} size="thumb" />
            </button>
            <figcaption>
              <strong>{p.caption || p.image_id}</strong>
              <span>{ui("photographer")}{p.photographer || ui("not_recorded")} · © {p.copyright || ui("not_recorded")}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <dialog
        ref={dialog}
        aria-label={ui("photo_viewer")}
        onCancel={() => setIndex(null)}
        onClose={() => setIndex(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            move(-1);
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            move(1);
          }
        }}
      >
        {photo && (
          <>
            <div className="dialog-tools">
              <span>
                {(index ?? 0) + 1} / {photos.length}
              </span>
              <button
                onClick={() => setSize(size === "large" ? "medium" : "large")}
              >
                {size === "large" ? ui("standard_size") : ui("large_size")}
              </button>
              <button autoFocus onClick={() => setIndex(null)}>{ui("close_esc")}</button>
            </div>
            <PhotoImage
              key={`${photo.image_id}-${size}`}
              photo={photo}
              size={size}
            />
            <p>
              {photo.caption || photo.image_id}{ui("photographer_103")}{" "}
              {photo.photographer || ui("not_recorded")} · © {photo.copyright || ui("not_recorded")}
            </p>
            <div className="dialog-tools">
              <button onClick={() => move(-1)}>{ui("previous_photo")}</button>
              <button onClick={() => move(1)}>{ui("next_photo")}</button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

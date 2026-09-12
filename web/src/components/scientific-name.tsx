import { scientificNameParts } from "@/lib/scientific-name";

export function ScientificName({ name }: { name: string }) {
  return <span style={{ fontStyle: "normal" }}>{scientificNameParts(name).map((part, index) =>
    part.italic ? <i key={index}>{part.text}</i> : <span key={index}>{part.text}</span>
  )}</span>;
}

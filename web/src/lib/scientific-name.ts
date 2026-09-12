export function plainScientificName(name: string): string {
  return name.replace(/\[\/?i\]/g, "");
}

export function scientificNameParts(name: string): { text: string; italic: boolean }[] {
  const parts: { text: string; italic: boolean }[] = [];
  let italic = false;
  for (const text of name.split(/(\[i\]|\[\/i\])/)) {
    if (text === "[i]") italic = true;
    else if (text === "[/i]") italic = false;
    else if (text) parts.push({ text, italic });
  }
  return parts;
}

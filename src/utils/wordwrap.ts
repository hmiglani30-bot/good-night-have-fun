export function wordWrap(text: string, width: number, maxLines?: number): string[] {
  if (!text) return [];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > width) {
      // Flush current line
      if (current) { lines.push(current); current = ""; }
      // Break long word into chunks
      for (let i = 0; i < word.length; i += width) {
        lines.push(word.slice(i, i + width));
      }
      continue;
    }

    if (current && current.length + 1 + word.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);

  if (maxLines && lines.length > maxLines) {
    const capped = lines.slice(0, maxLines);
    const last = capped[maxLines - 1];
    capped[maxLines - 1] = last.length >= width
      ? last.slice(0, width - 1) + "…"
      : last + "…";
    return capped;
  }

  return lines;
}

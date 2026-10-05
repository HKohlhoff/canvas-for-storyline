export function stableId(...parts: string[]): string {
  const value = parts.join("\u001f");
  let high = 0x811c9dc5;
  let low = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    high = Math.imul(high ^ code, 0x01000193) >>> 0;
    low = Math.imul(low ^ (code + index), 0x01000193) >>> 0;
  }
  return `${high.toString(16).padStart(8, "0")}${low.toString(16).padStart(8, "0")}`;
}

export function contentHash(content: string): string {
  return stableId("content", content);
}

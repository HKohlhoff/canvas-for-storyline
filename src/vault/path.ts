export function normalizeVaultPath(value: string): string {
  const segments = value.replace(/\\/g, "/").split("/");
  const normalized: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") normalized.pop();
    else normalized.push(segment);
  }
  return normalized.join("/");
}

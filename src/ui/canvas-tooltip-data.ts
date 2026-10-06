export function overviewTooltipDescriptions(content: string): Map<string, string> {
  const result = new Map<string, string>();
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!isRecord(parsed) || !Array.isArray(parsed.nodes)) return result;
    for (const node of parsed.nodes) {
      if (
        !isRecord(node) ||
        typeof node.id !== "string" ||
        typeof node.file !== "string" ||
        !node.file.toLowerCase().endsWith(".canvas") ||
        typeof node.cfsDescription !== "string"
      ) continue;
      const description = node.cfsDescription.trim();
      if (description) result.set(node.id, description);
    }
  } catch {
    // Ignore malformed or unrelated Canvas files; generation reports its own errors.
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

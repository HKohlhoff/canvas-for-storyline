export function visibleCanvasLabel(label: string): string {
  return label
    .replace(/\.canvas$/i, "")
    .replace(/^.* - (?=(?:Kapitel(?:\s|$)|Übersicht$))/i, "");
}

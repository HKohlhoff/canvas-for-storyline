const ABSOLUTE_LINK_PATTERN = /^(?:[a-z][a-z\d+.-]*:|#|\/)/iu;
const HTML_HREF_PATTERN = /\bhref\s*=\s*(["'])(.*?)\1/iu;
const KOFI_LINK_PATTERN = /^https:\/\/(?:www\.)?ko-fi\.com(?:\/|$)/iu;

export function prepareReadmeMarkdown(
  markdown: string,
  repositoryUrl: string,
): string {
  return normalizeBlankLines(
    rewriteRelativeLinks(removeImages(markdown), repositoryUrl),
  );
}

function removeImages(markdown: string): string {
  return markdown
    .replace(
      /<a\b([^>]*)>\s*<img\b[^>]*>\s*<\/a>/giu,
      (_match, attributes: string) => {
        const href = attributes.match(HTML_HREF_PATTERN)?.[2];
        return href !== undefined && KOFI_LINK_PATTERN.test(href)
          ? `[Support this plugin on Ko-fi](${href})`
          : "";
      },
    )
    .replace(/<img\b[^>]*>/giu, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, "");
}

function rewriteRelativeLinks(markdown: string, repositoryUrl: string): string {
  const repository = repositoryUrl.replace(/\/+$/u, "");
  return markdown.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu,
    (match, label: string, target: string) => {
      if (ABSOLUTE_LINK_PATTERN.test(target)) return match;
      const [rawPath, fragment = ""] = target.split("#", 2);
      if (rawPath === undefined || rawPath.length === 0) return match;
      const path = rawPath.replace(/^\.\//u, "");
      const view = path.endsWith("/") ? "tree" : "blob";
      const suffix = fragment.length === 0 ? "" : `#${fragment}`;
      return `[${label}](${repository}/${view}/master/${path}${suffix})`;
    },
  );
}

function normalizeBlankLines(markdown: string): string {
  return `${markdown.replace(/\n(?:[ \t]*\n){2,}/gu, "\n\n").trim()}\n`;
}

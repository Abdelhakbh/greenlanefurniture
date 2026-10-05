/** Remove legacy third-party intro lines from imported descriptions. */
export function cleanProductHtml(html: string) {
  return html
    .replace(
      /<p>\s*<strong>\s*OK Price\s*<\/strong>[\s\S]*?<\/p>\s*/gi,
      "",
    )
    .trim();
}

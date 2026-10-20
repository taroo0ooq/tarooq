function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Keep a whole English phrase together inside Arabic, including spaces between its words. */
function isolateLatinText(text: string) {
  return text.replace(
    /&(?:#\d+|#x[\da-fA-F]+|[a-zA-Z]+);|[A-Za-z][A-Za-z0-9+#/_'-]*(?:[ \t]+[A-Za-z][A-Za-z0-9+#/_'-]*)*/g,
    (token) => (token.startsWith("&") ? token : `\u2066${token}\u2069`),
  );
}

function isolateLatinHtml(html: string) {
  return html
    .split(/(<[^>]+>)/g)
    .map((part) => (part.startsWith("<") ? part : isolateLatinText(part)))
    .join("");
}

function inline(value: string, lang = "") {
  const html = escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return lang === "ar" ? isolateLatinHtml(html) : html;
}

export function renderMarkdown(markdown: string, lang = "") {
  const blocks = markdown.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n").filter((line) => line.length > 0);
      if (lines.length === 0) return "";
      if (lines.every((line) => /^#{1,3} /.test(line))) {
        return lines
          .map((line) => {
            const level = line.match(/^#+/)?.[0].length ?? 1;
            const tag = `h${Math.min(level + 1, 4)}`;
            return `<${tag}>${inline(line.replace(/^#{1,3} /, ""), lang)}</${tag}>`;
          })
          .join("");
      }
      if (lines.every((line) => /^[-*] /.test(line))) {
        return `<ul>${lines.map((line) => `<li>${inline(line.replace(/^[-*] /, ""), lang)}</li>`).join("")}</ul>`;
      }
      return `<p>${lines.map((line) => inline(line, lang)).join("<br>")}</p>`;
    })
    .join("\n");
}

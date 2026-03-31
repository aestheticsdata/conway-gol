import { APP_TEXTS } from "@texts";

function parseCommentMeta(line: string): { label: string; value: string } | null {
  const match = line.match(/^([^:]+):\s*(.+)$/);
  if (!match) {
    return null;
  }

  const label = match[1]?.trim();
  const value = match[2]?.trim();
  if (!label || !value) {
    return null;
  }

  return { label, value };
}

function createCommentRow(
  kind: "meta" | "body" | "link",
  itemPrefix: string,
): {
  row: HTMLDivElement;
  content: HTMLDivElement;
} {
  const row = document.createElement("div");
  row.className = `critter-comment critter-comment--${kind}`;

  const bullet = document.createElement("span");
  bullet.className = "critter-comment__bullet";
  bullet.setAttribute("aria-hidden", "true");
  bullet.textContent = itemPrefix.trim() || "-";

  const content = document.createElement("div");
  content.className = "critter-comment__content";

  row.append(bullet, content);
  return { row, content };
}

function createCommentNode(line: string, itemPrefix: string): HTMLElement | null {
  if (!line) {
    return null;
  }

  if (line.startsWith("http://") || line.startsWith("https://")) {
    const { row, content } = createCommentRow("link", itemPrefix);
    const anchor = document.createElement("a");
    anchor.className = "critter-comment__link";
    anchor.href = line;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.title = line;
    anchor.textContent = line;
    content.append(anchor);
    return row;
  }

  const meta = parseCommentMeta(line);
  if (meta) {
    const { row, content } = createCommentRow("meta", itemPrefix);
    const label = document.createElement("span");
    label.className = "critter-comment__label";
    label.textContent = `${meta.label}:`;

    const value = document.createElement("span");
    value.className = "critter-comment__value";
    value.textContent = meta.value;

    content.append(label, value);
    return row;
  }

  const { row, content } = createCommentRow("body", itemPrefix);
  const value = document.createElement("span");
  value.className = "critter-comment__value";
  value.textContent = line;
  content.append(value);
  return row;
}

export function buildCommentDomNodes(comments: string[]): HTMLElement[] {
  const itemPrefix = APP_TEXTS.comments.itemPrefix;
  return comments
    .map((line) => createCommentNode(line.trim(), itemPrefix))
    .filter((node): node is HTMLElement => node !== null);
}

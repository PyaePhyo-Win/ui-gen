import type { Message } from "ai";

export interface GeneratedFile {
  path: string;
  content: string;
}

const CODE_BLOCK_REGEX = /```([^\n`]*)\n([\s\S]*?)```/g;
const PATH_TOKEN_REGEX = /(\/[-\w./]+\.[A-Za-z0-9]+)/g;

function normalizeVirtualPath(path: string): string | null {
  const normalized = path.trim().replace(/\\/g, "/").replace(/\/+/g, "/");

  if (!normalized.startsWith("/") || normalized.includes("..")) {
    return null;
  }

  return normalized;
}

function extractPathToken(text: string): string | null {
  const matches = Array.from(text.matchAll(PATH_TOKEN_REGEX));
  const lastMatch = matches.at(-1)?.[1];

  return lastMatch ? normalizeVirtualPath(lastMatch) : null;
}

function extractPathFromComment(code: string): {
  path: string | null;
  content: string;
} {
  const normalizedCode = code.replace(/\r\n/g, "\n");
  const lines = normalizedCode.split("\n");
  const firstLine = lines[0]?.trim() ?? "";
  const commentPath =
    firstLine.match(/^\/\/\s*(\/[-\w./]+\.[A-Za-z0-9]+)\s*$/)?.[1] ??
    firstLine.match(/^#\s*(\/[-\w./]+\.[A-Za-z0-9]+)\s*$/)?.[1] ??
    firstLine.match(/^\/\*\s*(\/[-\w./]+\.[A-Za-z0-9]+)\s*\*\/$/)?.[1] ??
    firstLine.match(/^<!--\s*(\/[-\w./]+\.[A-Za-z0-9]+)\s*-->$/)?.[1] ??
    null;

  return {
    path: commentPath ? normalizeVirtualPath(commentPath) : null,
    content: commentPath ? lines.slice(1).join("\n") : normalizedCode,
  };
}

function defaultAppPath(info: string, code: string, totalBlocks: number): string | null {
  if (totalBlocks !== 1) {
    return null;
  }

  const normalizedInfo = info.toLowerCase();
  const looksLikeReactApp = /export\s+default|function\s+App|const\s+App|class\s+App/.test(
    code
  );

  if (!looksLikeReactApp) {
    return null;
  }

  if (
    normalizedInfo.includes("tsx") ||
    normalizedInfo.includes("typescript")
  ) {
    return "/App.tsx";
  }

  if (
    normalizedInfo === "" ||
    normalizedInfo.includes("jsx") ||
    normalizedInfo.includes("javascript") ||
    normalizedInfo.includes("js")
  ) {
    return "/App.jsx";
  }

  return null;
}

export function extractGeneratedFilesFromText(text: string): GeneratedFile[] {
  const files = new Map<string, string>();
  const blocks = Array.from(text.matchAll(CODE_BLOCK_REGEX));

  for (const block of blocks) {
    const info = block[1]?.trim() ?? "";
    const rawCode = block[2] ?? "";
    const blockIndex = block.index ?? 0;
    const { path: commentPath, content: contentWithoutComment } =
      extractPathFromComment(rawCode);

    const path =
      extractPathToken(info) ??
      commentPath ??
      extractPathToken(text.slice(Math.max(0, blockIndex - 200), blockIndex)) ??
      defaultAppPath(info, contentWithoutComment, blocks.length);

    if (!path) {
      continue;
    }

    const normalizedContent = contentWithoutComment
      .replace(/^\n+/, "")
      .trimEnd();

    if (normalizedContent.length === 0) {
      continue;
    }

    files.set(path, `${normalizedContent}\n`);
  }

  return Array.from(files.entries()).map(([path, content]) => ({
    path,
    content,
  }));
}

export function getAssistantMessageText(
  message: Pick<Message, "content" | "parts">
): string {
  if (typeof message.content === "string" && message.content.trim().length > 0) {
    return message.content;
  }

  return (
    message.parts
      ?.flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join("") ?? ""
  );
}
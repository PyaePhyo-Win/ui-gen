import { tool } from "ai";
import { z } from "zod";
import { VirtualFileSystem } from "@/lib/file-system";

const TextEditorParameters = z.object({
  command: z
    .enum(["view", "create", "str_replace", "insert", "undo_edit"])
    .describe("The editor action to perform"),
  path: z.string().describe("The absolute path inside the virtual file system"),
  file_text: z
    .string()
    .optional()
    .describe("Full file contents for create operations"),
  insert_line: z
    .number()
    .optional()
    .describe("0-based line number used by insert operations"),
  new_str: z
    .string()
    .optional()
    .describe("Replacement text for str_replace or inserted text for insert"),
  old_str: z
    .string()
    .optional()
    .describe("Exact text to replace during str_replace operations"),
  view_range: z
    .array(z.number())
    .optional()
    .describe("Optional [startLine, endLine] range for view operations"),
});

export const buildStrReplaceTool = (fileSystem: VirtualFileSystem) => {
  return tool({
    description:
      "View files and make targeted edits in the virtual file system. Use create to add files, view before editing existing files, str_replace for exact replacements, and insert for line-based inserts.",
    parameters: TextEditorParameters,
    execute: async ({
      command,
      path,
      file_text,
      insert_line,
      new_str,
      old_str,
      view_range,
    }: z.infer<typeof TextEditorParameters>) => {
      switch (command) {
        case "view":
          return fileSystem.viewFile(
            path,
            view_range as [number, number] | undefined
          );

        case "create":
          return fileSystem.createFileWithParents(path, file_text || "");

        case "str_replace":
          return fileSystem.replaceInFile(path, old_str || "", new_str || "");

        case "insert":
          return fileSystem.insertInFile(path, insert_line || 0, new_str || "");

        case "undo_edit":
          return `Error: undo_edit command is not supported in this version. Use str_replace to revert changes.`;
      }
    },
  });
};

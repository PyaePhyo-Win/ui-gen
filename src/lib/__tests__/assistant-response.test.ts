import { expect, test } from "vitest";
import {
  ASSISTANT_FALLBACK_STATUS,
  extractGeneratedFilesFromText,
  hasAssistantCodeBlocks,
  getAssistantMessageText,
  summarizeAssistantResponse,
} from "../assistant-response";

test("extracts files from fenced code blocks with path comments", () => {
  const files = extractGeneratedFilesFromText(
    "```jsx\n// /App.jsx\nexport default function App() {\n  return <div>Hello</div>;\n}\n```"
  );

  expect(files).toEqual([
    {
      path: "/App.jsx",
      content:
        "export default function App() {\n  return <div>Hello</div>;\n}\n",
    },
  ]);
});

test("extracts files from referenced paths before code blocks", () => {
  const files = extractGeneratedFilesFromText(
    "Create `/components/Card.jsx`:\n```jsx\nexport function Card() {\n  return <div>Card</div>;\n}\n```"
  );

  expect(files).toEqual([
    {
      path: "/components/Card.jsx",
      content: "export function Card() {\n  return <div>Card</div>;\n}\n",
    },
  ]);
});

test("defaults a single React app block to App.jsx", () => {
  const files = extractGeneratedFilesFromText(
    "```jsx\nexport default function App() {\n  return <main>Ready</main>;\n}\n```"
  );

  expect(files).toEqual([
    {
      path: "/App.jsx",
      content:
        "export default function App() {\n  return <main>Ready</main>;\n}\n",
    },
  ]);
});

test("reads assistant text from parts when content is empty", () => {
  const text = getAssistantMessageText({
    content: "",
    parts: [
      {
        type: "text",
        text: "First part. ",
      },
      {
        type: "text",
        text: "Second part.",
      },
    ],
  } as any);

  expect(text).toBe("First part. Second part.");
});

test("summarizeAssistantResponse strips fenced code without inventing file actions", () => {
  const summary = summarizeAssistantResponse(
    "I created the file below.\n\n```jsx\n// /App.jsx\nexport default function App() {\n  return <div>Hello</div>;\n}\n```"
  );

  expect(summary).toBe("I created the file below.");
  expect(summary).not.toContain("Created /App.jsx");
  expect(summary).not.toContain(ASSISTANT_FALLBACK_STATUS);
});

test("hasAssistantCodeBlocks detects fenced code in assistant responses", () => {
  expect(
    hasAssistantCodeBlocks(
      "```tsx\nexport default function App() {\n  return null;\n}\n```"
    )
  ).toBe(true);
  expect(hasAssistantCodeBlocks("Plain text only.")).toBe(false);
});
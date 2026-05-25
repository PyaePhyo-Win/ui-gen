# UIGen

AI-powered React component generator with live preview. This project allows users to describe UI components and have them generated, previewed, and edited in real-time using Claude and a virtual file system.

## Project Overview

- **Purpose:** Rapid prototyping and generation of React components via natural language.
- **Main Technologies:**
  - **Framework:** Next.js 15 (App Router)
  - **Runtime:** React 19, TypeScript
  - **Styling:** Tailwind CSS v4
  - **Database:** Prisma with SQLite
  - **AI Integration:** Vercel AI SDK with Google Gemini
  - **Code Processing:** Babel Standalone (for browser-side JSX transformation)
  - **Key Features:**
    - **Virtual File System:** Files are managed in memory (not written to disk during the generation process).
    - **Live Preview:** Real-time hot-reloading preview frame using an iframe and blob URLs.
    - **Tool-Based Generation:** AI uses specific tools (`str_replace_editor`, `file_manager`) to manipulate the virtual file system.
    - **Persistence:** Registered users can save and load projects.

  ## Building and Running

  ### Prerequisites
  - Node.js 18+
  - npm

  ### Setup
  ```bash
  npm run setup
  ```
  *Note: This installs dependencies, generates the Prisma client, and runs migrations.*

  ### Development
  ```bash
  npm run dev
  ```
  *Access the app at http://localhost:3000.*

  ### Testing
  ```bash
  npm run test
  ```
  *Runs unit tests using Vitest.*

  ### Linting
  ```bash
  npm run lint
  ```

  ## Development Conventions

  ### Architecture
  - **App Router:** Follows Next.js 15 App Router conventions (`src/app`).
  - **Actions:** Server actions are located in `src/actions`.
  - **Components:** UI components are in `src/components`, separated into `ui`, `chat`, `editor`, and `preview`.
  - **Lib:** Core logic for the virtual file system, AI tools, and code transformation resides in `src/lib`.

  ### Virtual File System (VFS)
  - The core of the application is the `VirtualFileSystem` class in `src/lib/file-system.ts`.
  - It mimics a POSIX-like file system with file and directory nodes.
  - AI interactions happen via tools that wrap VFS methods.

  ### Code Transformation
  - `src/lib/transform/jsx-transformer.ts` handles the transformation of JSX/TSX into executable JavaScript for the preview frame.
  - It uses `@babel/standalone` and creates an import map for browser-native ESM support.

  ### Testing
  - Unit tests are co-located with their respective modules in `__tests__` directories.
  - Vitest is the primary test runner.
  - Always add tests for new logic in `src/lib` or complex components.

  ### Security
  - Use `src/lib/auth.ts` for session management and authentication.
  - Secrets (like `GOOGLE_GENERATIVE_AI_API_KEY`) should be stored in `.env` and never logged or committed.


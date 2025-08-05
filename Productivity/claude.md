# Productivity Suite - Claude Context

## Project Overview
Building a local AI-powered productivity suite with:
- CopilotNest: Central knowledge hub
- CopilotDoc: Word processor
- CopilotGrid: Spreadsheet
- CopilotInbox: Email assistant  
- Mini Claude Code: Code editor
- Unified Mini Copilot AI integration

## Tech Stack (Based on Research)
- Framework: Tauri (for performance) 
- Frontend: React + TypeScript
- Monorepo: Turbo
- AI: Ollama with local models (Phi-3, Mistral)
- Rich Text: TipTap
- Spreadsheet: Luckysheet
- Code Editor: Monaco
- State: Zustand
- File Search: MiniSearch + SQLite FTS5

## Project Structure
```
productivity-suite/
├── apps/               # Individual applications
│   ├── copilot-nest/   # Central hub
│   ├── copilot-doc/    # Word processor
│   ├── copilot-grid/   # Spreadsheet
│   ├── copilot-inbox/  # Email client
│   └── mini-claude-code/ # Code editor
├── packages/           # Shared packages
│   ├── shared-ui/      # Common UI components
│   ├── ai-engine/      # AI integration layer
│   └── file-system/    # File operations & indexing
├── tests/              # E2E and integration tests
└── docs/               # Documentation
```

## Development Commands
- `npm run dev` - Start all apps in development
- `npm run build` - Build all apps
- `npm run test` - Run all tests
- `npm run lint` - Lint codebase
- `npm run typecheck` - Type check

## Key Implementation Notes
1. Use Tauri IPC for secure file system access
2. Implement AI calls through background workers
3. Use SQLite for local data persistence
4. Share UI components via @productivity-suite/shared-ui
5. Centralize AI logic in @productivity-suite/ai-engine

## Security Considerations
- All data stays local
- Use Tauri's permission system
- Encrypt sensitive data in SQLite
- Sanitize all file paths
- No external API calls except local AI models
# Productivity Suite

A comprehensive productivity suite built with modern web technologies, featuring AI-powered applications for document management, data organization, and workflow automation.

## 🚀 Features

### Applications
- **Copilot Doc** - AI-powered document editor with rich text capabilities
- **Copilot Grid** - Intelligent data grid and spreadsheet application
- **Copilot Inbox** - Smart inbox management and organization
- **Copilot Nest** - Unified workspace and project management
- **Mini Claude Code** - Lightweight code editor with AI assistance

### Core Packages
- **AI Engine** - Unified AI provider with Ollama and Transformers.js support
- **File System** - Cross-platform file operations with Tauri integration
- **Shared UI** - Reusable React components and design system

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Desktop**: Tauri (Rust)
- **Styling**: Tailwind CSS
- **AI**: Ollama, Transformers.js
- **Monorepo**: Turbo
- **Testing**: Jest, Playwright, Testing Library
- **Build**: tsup, Vite

## 📦 Project Structure

```
├── apps/                     # Applications
│   ├── copilot-doc/         # Document editor
│   ├── copilot-grid/        # Data grid application
│   ├── copilot-inbox/       # Inbox management
│   ├── copilot-nest/        # Workspace management
│   └── mini-claude-code/    # Code editor
├── packages/                 # Shared packages
│   ├── ai-engine/           # AI provider abstraction
│   ├── file-system/         # File operations
│   └── shared-ui/           # UI components
├── tests/                    # End-to-end tests
└── scripts/                 # Build and setup scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust (for Tauri)
- pnpm (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/migueloritz/productivity-suite.git
cd productivity-suite

# Install dependencies
pnpm install

# Start development environment
pnpm dev
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Build all packages and apps
pnpm build

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Individual App Development

```bash
# Copilot Doc
cd apps/copilot-doc
pnpm tauri:dev

# Copilot Grid
cd apps/copilot-grid
pnpm tauri:dev

# Other apps follow the same pattern
```

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests**: Jest with Testing Library
- **Integration Tests**: Cross-package integration
- **E2E Tests**: Playwright for full application testing
- **Performance Tests**: AI operations benchmarking

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Coverage reports
pnpm test:coverage
```

## 🔧 Configuration

### AI Engine Setup

The AI engine supports multiple providers:

1. **Ollama** (Primary): Local AI models
2. **Transformers.js** (Fallback): Browser-based AI

Configure in your environment or app settings.

### Tauri Configuration

Each app includes Tauri configuration for desktop functionality:
- File system access
- Native OS integration
- Window management
- System tray integration

## 📁 Package Details

### @productivity-suite/ai-engine
Unified AI provider with streaming support, context management, and automatic fallbacks.

### @productivity-suite/file-system
Cross-platform file operations with Tauri integration for secure file access.

### @productivity-suite/shared-ui
Reusable React components built with Tailwind CSS and TypeScript.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For questions and support, please open an issue in the GitHub repository.

---

Built with ❤️ using modern web technologies and AI-powered productivity tools.

# Contributing to NexusForge

Thank you for your interest in contributing to NexusForge! This document provides guidelines and instructions for contributing to the project.

## How to Contribute

There are many ways to contribute to NexusForge:

- **Report bugs** - Submit bug reports with clear reproduction steps
- **Suggest features** - Open feature requests with detailed descriptions
- **Write code** - Fix bugs, implement features, or improve documentation
- **Review pull requests** - Provide constructive feedback on PRs
- **Improve documentation** - Fix typos, clarify explanations, add examples

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or later) - Runtime and package manager
- [Git](https://git-scm.com/) - Version control
- Node.js (v18 or later) - Optional, for compatibility

### Clone the Repository

```bash
git clone https://github.com/0xgetz/nexusforge.git
cd nexusforge
```

### Install Dependencies

```bash
bun install
```

This installs dependencies for all packages in the monorepo.

### Build All Packages

```bash
bun run build
```

### Run Tests

```bash
bun test
```

## Project Structure

NexusForge is a monorepo with the following packages:

```
nexusforge/
├── packages/
│   ├── cli/          # AI Coding Assistant (Phase 1)
│   ├── scanner/      # Security Scanner (Phase 2)
│   ├── healer/       # Self-Healing Engine (Phase 3)
│   ├── sdk/          # Plugin SDK (Phase 4)
│   ├── testgen/      # AI Test Generator (Phase 5)
│   ├── deployer/     # Smart Deployer (Phase 6)
│   └── guardian/     # Code Guardian (Phase 7)
├── src/              # Next.js frontend application
├── .github/          # GitHub workflows and templates
└── docs/             # Documentation
```

## Code Style

### TypeScript

All code is written in TypeScript. We follow strict typing conventions:

- Use explicit type annotations for function parameters and return types
- Avoid `any` - use `unknown` with type guards when necessary
- Use interfaces for object shapes, types for unions and intersections
- Enable strict mode in `tsconfig.json`

### Biome

We use [Biome](https://biomejs.dev/) for code formatting and linting:

```bash
# Check for formatting and linting issues
bun run lint

# Auto-fix issues
bun run format
```

### Code Conventions

- **Naming**: Use PascalCase for components/classes, camelCase for variables/functions, UPPER_CASE for constants
- **Imports**: Organize imports in this order: std libs, external packages, internal modules, relative imports
- **Functions**: Keep functions small and focused. Prefer composition over inheritance
- **Comments**: Write self-documenting code. Add comments for complex logic, not obvious statements

## Pull Request Process

1. **Fork the repository** and create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines above

3. **Write tests** that cover your changes. All new features must include tests

4. **Update documentation** if your changes affect public APIs or user-facing behavior

5. **Run checks** before committing:
   ```bash
   bun run lint
   bun run format
   bun run test
   ```

6. **Commit with clear messages** following [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(cli): add new scaffold command
   fix(scanner): resolve false positive in CVE detection
   docs: update installation instructions
   ```

7. **Open a pull request** with:
   - A clear title and description
   - Screenshots for UI changes
   - Links to related issues
   - Checklist completion (see `.github/PULL_REQUEST_TEMPLATE.md`)

8. **Address review feedback** promptly and push updates to your branch

9. **Squash commits** if requested by maintainers before merging

## Testing Requirements

### Unit Tests

- Write tests for all new public functions and methods
- Aim for high coverage on critical paths (security, deployment, healing logic)
- Use Bun's built-in test runner
- Mock external services and APIs

### Integration Tests

- Test package interactions where applicable
- Verify end-to-end flows for critical features
- Use test fixtures and temporary directories

### Running Tests

```bash
# Run all tests
bun test

# Run tests for a specific package
cd packages/cli && bun test

# Run tests with coverage
bun test --coverage
```

## Security

- Never commit secrets, API keys, or credentials
- Scan your changes before submitting: `bun run security:scan`
- Report vulnerabilities privately via [GitHub Security Advisories](https://github.com/0xgetz/nexusforge/security/advisories)

## Questions?

- Check existing [issues](https://github.com/0xgetz/nexusforge/issues) for answers
- Ask in [GitHub Discussions](https://github.com/0xgetz/nexusforge/discussions)
- Tag maintainers in relevant issues for guidance

Thank you for contributing to NexusForge!

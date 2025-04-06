# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Build/Run: `npm run dev` (development with Turbopack), `npm run build`, `npm run start`
- Lint: `npm run lint`
- No specific test commands found

## Code Style Guidelines
- **TypeScript**: Use strict typing. Define interfaces for component props and data models
- **Imports**: Use path aliases (`@/*`) for src directory imports
- **Components**: Use functional components with explicit type definitions
- **UI**: Follow Tailwind CSS patterns with utility classes. Use the `cn()` utility for class merging
- **Next.js**: Follow App Router conventions with page.tsx files in directories
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for files
- **Formatting**: Use consistent indentation (2 spaces) and trailing commas
- **Error Handling**: Use try/catch for async operations with appropriate error states

Be consistent with existing code patterns in the codebase when making changes.
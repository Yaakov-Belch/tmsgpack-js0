# AGENTS.md - Coding Guidelines for tmsgpack

## Build/Test Commands
- `npm test` - Run all tests
- `npm run test -- test/specific.test.ts` - Run single test file
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix linting and format with Prettier
- `npm run prepare` - Build all distributions (CJS, ESM, UMD)

## Code Style
- **Imports**: Use `.ts` extensions, prefer type imports (`import type`)
- **Formatting**: Prettier config: 120 char width, trailing commas, preserve quote props
- **Types**: PascalCase for types, camelCase for variables, explicit module boundary types required
- **Arrays**: Use generic syntax `Array<T>` not `T[]`
- **Naming**: camelCase/PascalCase/UPPER_CASE allowed, leading underscore OK for unused args
- **Exports**: Prefer named exports over default exports
- **Comments**: TSDoc syntax for public APIs
- **Error Handling**: Use custom error classes like `DecodeError`
- **No-ops**: Avoid `any`, non-null assertions OK, empty functions/interfaces allowed

## Testing
- Mocha test framework with `.test.ts` suffix
- Cross-platform testing: Node.js, Deno, Bun, browsers
- Use `assert` for assertions in tests

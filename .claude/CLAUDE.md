# Claude Code Agent Instructions

## Core Workflow Rule

Whenever you are given a new feature request, bug fix, or exploration task, you must follow this exact sequence:

1. **FIRST STEP - ALWAYS:** Run `/graphify` (or use the graph query tool) to map out the relevant file architecture and function dependencies.
2. Do not attempt to use `grep`, `ls`, or direct file exploration until you have fully executed the graph query.
3. If the graph query fails or returns nothing, state that it failed, and _only then_ fallback to standard file search tools.

## Testing Rules

- **DO NOT** use browser tools, the `claude-in-chrome` extension, or open any web browsers to test the application.
- I will handle all manual browser testing myself. Only output instructions on how to test, but do not execute the tests.

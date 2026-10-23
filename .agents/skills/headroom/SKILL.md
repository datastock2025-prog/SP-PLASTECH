---
name: headroom
description: >
  Context optimization and cognitive headroom management. Keeps agent context lean,
  compresses tool outputs, avoids verbose repetitive dumps, and delivers crisp,
  actionable, high-signal communication.
license: MIT
---

# Headroom — Context Engineering & Cognitive Efficiency

Headroom ensures that AI agent execution preserves context window headroom, avoids hallucination from token bloat, and optimizes problem-solving speed.

## Core Rules

1. **Information Density over Verbiage**:
   - Provide direct, high-signal explanations.
   - Do not repeat file contents back to the user when artifact links or concise diff summaries suffice.
   - Summarize test runs and build outputs with exact counts (e.g. `93/93 passing, 0 errors`) rather than dumping hundreds of lines of terminal logs.

2. **Breadcrumb Anchoring**:
   - Link directly to file paths and line ranges using `[file.ts](file:///path/to/file.ts#L10-L20)`.
   - Never paste large duplicated blocks into chat when a reference to existing code or artifact is cleaner.

3. **Incremental Execution**:
   - Break large cross-cutting changes into discrete, verifiable phases.
   - Verify each phase before moving to the next (e.g., Schema -> Migration -> API Router -> Client -> Tests).

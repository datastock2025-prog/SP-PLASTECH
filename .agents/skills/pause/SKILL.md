---
name: pause
description: Halt agent execution immediately, preserve current session context and pending task queue to .agents/session_state.json, and keep the session safely paused. Use when the user types /pause in chat.
---

# /pause — Execution Halt and Session Preservation Protocol

This skill is invoked when the user sends `/pause` in chat.

## Instructions

1. **Immediate Execution Freeze**:
   - Do NOT run any further code edits, automated refactors, migrations, or shell mutations.
   - If background tasks or servers were intentionally started by user instruction, keep them running unless the user requested stopping them.

2. **Save Checkpoint**:
   - Inspect current workspace state (`git status`, uncommitted changes, open tasks).
   - Write or update `.agents/session_state.json` with the following structure:
     ```json
     {
       "status": "PAUSED",
       "timestamp": "<ISO-TIMESTAMP>",
       "last_goal": "<Brief description of what was being worked on>",
       "completed_steps": ["<step 1>", "<step 2>"],
       "pending_tasks": ["<next planned task 1>", "<next planned task 2>"],
       "modified_files": ["<file paths>"],
       "resume_instruction": "<Precise action to take upon /resume>"
     }
     ```

3. **Report to User**:
   - Output a clear, structured pause confirmation:
     - State that execution is **Paused ⏸️**.
     - List what was completed, what pending tasks were frozen, and any modified files.
     - Remind the user: "Type `/resume` anytime to activate and continue execution from this exact checkpoint."
   - **CRITICAL**: Cease all further tool calls immediately. End your turn.

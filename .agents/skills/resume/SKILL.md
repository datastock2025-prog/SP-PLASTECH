---
name: resume
description: Reactivate and resume the last paused session from .agents/session_state.json, restoring pending tasks, modified files, and continuing execution seamlessly. Use when the user types /resume in chat.
---

# /resume — Session Reactivation and Continuation Protocol

This skill is invoked when the user sends `/resume` in chat.

## Instructions

1. **Load Checkpoint**:
   - Check for `.agents/session_state.json`.
   - If not found or if no session was paused:
     - Check the most recent conversation transcript or git status.
     - Summarize current state and ask what task to continue.
   - If found:
     - Read `last_goal`, `completed_steps`, `pending_tasks`, and `resume_instruction`.

2. **Rehydrate & Verify**:
   - Check workspace status (verify modified files still exist, local dev server is alive).
   - Update `.agents/session_state.json` setting `"status": "ACTIVE"`.

3. **Announce and Execute**:
   - Output a clear reactivation confirmation:
     - State that execution is **Resumed ▶️**.
     - Display the objective being continued and the pending queue.
   - **Immediately proceed** with executing the `resume_instruction` and completing `pending_tasks` without waiting for further prompts.

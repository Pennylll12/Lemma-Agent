---
name: lark-knowledge
description: Read, summarize, analyze, and update company knowledge stored in Lark Wiki or Lark Docs. Use when a user provides a Lark URL or asks to inspect Lark content, summarize a document, extract action items, identify unfinished work, find decisions or owners, or explicitly append an update to a Lark document.
---

# Lark Knowledge

Use shared Lark tools to work with company knowledge stored in Lark.

## Operating rules

- Prefer read-only operations by default.
- Use `read_lark_document` for reading, summarizing, analyzing, extracting, or checking Lark content.
- Use `append_lark_document` only when the user explicitly asks to write, append, record, or update content.
- Never expose App Secrets, access tokens, environment variables, or API credentials.
- Never invent missing owners, deadlines, decisions, or document content.
- If a write operation fails because of permissions, report the failure clearly instead of retrying blindly.

## Read workflow

1. Identify the target Lark URL.
2. Call `read_lark_document`.
3. Read the returned content.
4. Perform the requested analysis.
5. Separate document facts from interpretation.

## Write workflow

1. Confirm that the user explicitly requested a write.
2. Identify the target Lark document.
3. Prepare the exact text to append.
4. Call `append_lark_document`.
5. Report what was written.

Do not modify a document when the user only asks to read, inspect, summarize, or analyze it.

## Common tasks

### Summarize

Return:
- key points
- decisions
- important dates
- owners
- open questions

### Extract action items

Prefer this structure:

- Task
- Owner
- Status
- Due date

Do not invent missing information.

### Identify unfinished work

Look for:
- pending items
- TODOs
- undecided items
- missing owners
- missing deadlines
- follow-up work

### Update a document

Append only the content the user requested.

For detailed tool behavior, read `references/lark-tools.md`.
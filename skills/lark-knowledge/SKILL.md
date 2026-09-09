---
name: lark-knowledge
description: Read, summarize, analyze, and update Lark Wiki or Doc content through shared Lark tools. Use when a user provides a Lark Wiki/Doc URL or asks to inspect company knowledge, summarize documents, extract action items, identify unfinished work, or append explicitly requested updates to a Lark document.
---

# Lark Knowledge

Use the shared Lark tools to work with company knowledge stored in Lark.

## Core behavior

- Prefer read-only operations by default.
- Use `read_lark_document` when the user wants to inspect, summarize, analyze, or extract information from a Lark document.
- Use `append_lark_document` only when the user clearly asks to write, append, or update content.
- Do not expose Lark App IDs, App Secrets, access tokens, or internal API credentials.
- Do not assume a document can be edited just because it can be read.
- If a write operation fails because of permissions, report the permission problem rather than retrying blindly.

## Reading workflow

1. Receive a Lark Wiki or document URL.
2. Call `read_lark_document`.
3. Read the returned content.
4. Perform the user's requested analysis.
5. Clearly separate information found in the document from your own interpretation.

Typical requests:

- Summarize this Lark document.
- What tasks are still unfinished?
- Extract action items and owners.
- Identify decisions made in this meeting document.
- Find information related to a specific topic.

## Writing workflow

Only write when the user explicitly requests a modification.

1. Confirm the target document from the provided URL.
2. Prepare the exact text to be written.
3. Call `append_lark_document`.
4. Report what was written and where.

Do not silently modify documents during a read or analysis request.

## Tool inputs

### read_lark_document

Input:

```json
{
  "url": "https://example.larksuite.com/wiki/..."
}


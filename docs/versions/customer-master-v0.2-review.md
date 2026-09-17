# Customer Master v0.2 Review

## Branch

`feature/customer-master-v0.2-review`

## Scope

This version freezes and cleans up the Customer Master v0.1 foundation before follow-up logic is redesigned. It includes schema validation foundations, architecture documentation, legacy data documentation, and existing deterministic queue acceptance tooling. It does not add AI, media processing, webhooks, dashboards, auto-reply, bulk Firestore writes, or SleekFlow sync expansion.

## Schema changes

- New customer writes use `SLEEKFLOW` as the source and leave unknown `scheme`, `estate`, and `latestIntent` as `null`.
- New conversation writes contain only canonical operational fields and do not write AI classification fields.
- `customerEvents` and `aiAnalysis` have validation foundations only. No documents are created merely to make empty collections visible.

## Fields removed from new writes

- Customer fields: `isOwner`, `groupStatus`, `nextAction`, `conversationStatus`, `lastAiProcessedAt`.
- Deterministic conversation fields: `primaryIntent`, `secondaryIntents`, `summary`, `detectedStage`, `suggestedAction`, `confidence`.

## Repositories added

- `runtime/customer-master/customer-event-repository.js` validates the canonical `customerEvents/{eventId}` document shape without a write operation.
- `runtime/customer-master/ai-analysis-repository.js` validates the canonical `aiAnalysis/{analysisId}` document shape without a write operation.

## Legacy data differences

Existing Firestore documents are not migrated on this branch. Earlier data can contain legacy fields or omit newer operational timestamps and QA context. See [Customer Master Legacy Data v0.1](../customer-master-legacy-data-v0.1.md).

## Current follow-up architecture

See [Customer Master Follow up Architecture v0.1](../customer-master-follow-up-architecture-v0.1.md). The message parser, acknowledgement detection, state calculation, `followUpRequired` derivation, and queue query are frozen for review.

## Known limitations

- `customerEvents` and `aiAnalysis` are schemas only; no event or analysis writer is intentionally exposed yet.
- Historical QA fields remain unavailable in legacy Firestore records until a separately approved controlled re-sync or migration.
- Queue priority stays deterministic and conservative; no AI-based priority is introduced.

## Next review step

Review the deterministic follow-up state and acceptance output. Approve a controlled legacy re-sync or migration plan only after the schema and operational rules are accepted.

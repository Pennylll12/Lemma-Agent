# Customer Master Legacy Data v0.1

## Scope

Existing Firestore documents may have been created by earlier Customer Master sync versions. They are not assumed to reflect the current v0.1 schema.

## Legacy customer fields

Earlier new customer records could include `isOwner`, `groupStatus`, `nextAction`, `conversationStatus`, and `lastAiProcessedAt`. They are not part of Schema v0.1 and are no longer generated for new records. No destructive migration is performed in this branch.

## Legacy conversation fields

Earlier deterministic writes could include `primaryIntent`, `secondaryIntents`, and `summary`, or omit `lastInboundAt`, `lastOutboundAt`, `sleekflowUpdatedAt`, `lastSyncedAt`, and `createdAt`. AI-derived fields are no longer written by deterministic sync.

## QA visibility differences

The current acceptance output can show `null` for last inbound/outbound timestamps, previous message context, and `messageCountUsedForStatus` when they were not stored by the earlier sync. The acceptance command is read-only and does not fabricate missing data.

## Required later action

After code review, use a separately approved, controlled re-sync or migration plan to refresh legacy documents. Do not run a bulk apply or destructive migration as part of this branch.

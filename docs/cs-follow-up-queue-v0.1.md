# CS Follow-up Queue v0.1

## Scope

This feature provides a read-only operational queue for Customer Service follow-up. It does not add AI classification, media processing, customer journey automation, auto-reply, or dashboard analytics.

## Architecture

`conversations` is the operational source of truth. The queue reads only conversations where `followUpRequired == true` and `status == WAITING_US`, then joins `customerId` to `customers/{customerId}` for the display phone and name. `syncState` remains owned by synchronization and is never written by the queue.

## Query and ordering

The repository applies the two Firestore equality filters, normalizes a missing or invalid priority to `P3`, then sorts in memory by priority (`P0` through `P4`) and `lastMessageAt` ascending. In-memory sorting is intentional: Firestore `orderBy("priority")` omits documents without that field, while v0.1 requires missing priorities to default to `P3`.

## Returned fields

Each repository queue item contains `conversationId`, `customerId`, `phoneDisplay`, `customerName`, `customerMissing`, `channel`, `status`, `priority`, `lastMessageAt`, `lastMessageText`, `waitingMinutes`, and `waitingHours`. Phone normalization, credentials, and service account data are never returned.

The CLI is safe and read-only:

```sh
npm run queue:follow-up
```

It defaults to 50 items, makes no SleekFlow calls, masks display phones as `9123****`, and shortens message text to 120 characters for a compact operational listing.

## Tests

The customer-master test suite covers inclusion of waiting conversations, query exclusion of other states, default priority, oldest-first ordering, missing customer records, waiting duration, phone masking, and the absence of `phoneNormalized` from queue items.

## Known limitations

- The current queue reads the matching Firestore result set before applying its display limit so that missing priority values can safely sort as `P3`.
- The queue does not modify conversation priority based on content; priority remains deterministic and conservative.
- Existing customer and conversation records must be refreshed by the SleekFlow sync for the latest operational state.

## Next recommended step

Review the queue output with CS. After operational rules are accepted, add a narrowly scoped, human-reviewed priority policy before considering AI analysis.

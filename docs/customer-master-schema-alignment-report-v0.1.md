# Customer Master Schema Alignment Report v0.1

Date: 2026-09-17

## Scope

This report compares the current implementation under `runtime/customer-master/` with `Supermama Customer Master Firestore Schema v0.1`. The scope is Customer Master v0.1 and deterministic Conversation Operational State v0.1 only. No AI classification, customer journey classification, dashboard, or expanded synchronization is included.

## Schema alignment

| Current field or behavior | Expected Schema v0.1 field or behavior | Collection | Status | Required change and result |
| --- | --- | --- | --- | --- |
| `customerId` uses `cust_<uuid>` and phone normalization is used for lookup | Internal `cust_<uuid>` ID; `phoneNormalized` is the deduplication key and not the document ID | `customers` | MATCH | Retained. |
| `source: "whatsapp"` | `source: "SLEEKFLOW"` | `customers` | WRONG VALUE | Updated for newly created customer records. |
| `scheme: "UNKNOWN"`, `estate: "UNKNOWN"`, `latestIntent: "OTHER"` | Optional AI or CS fields must not be populated during this deterministic phase | `customers` | WRONG VALUE | Changed to `null` for newly created customer records. |
| `isOwner`, `groupStatus`, `nextAction`, `conversationStatus`, `lastAiProcessedAt` | Not part of Schema v0.1 customer fields | `customers` | EXTRA | No longer generated for new records. Existing documents are not destructively migrated by this report. |
| `lastInboundAt`, `lastOutboundAt`, `lastConversationId` | Recommended customer projection fields | `customers` | MATCH | Retained with conservative initial values; cross-conversation projection is not introduced in this phase. |
| Conversation document ID equals `conversationId` and contains `customerId` | SleekFlow conversation ID and canonical customer reference | `conversations` | MATCH | Retained. |
| Channel defaulted to `whatsapp` only | Actual SleekFlow channel, falling back to `whatsapp` | `conversations` | MISSING MAPPING | Adapter now maps the provider channel without exposing raw provider payloads to repositories. |
| `lastInboundAt` and `lastOutboundAt` absent from writes | Message parser timestamps | `conversations` | MISSING | Added. |
| Sender values were `customer`, `cs`, or `system` | `CUSTOMER`, `CS`, or `null` | `conversations` | WRONG VALUE | Normalized in the adapter and validated by the repository. |
| `primaryIntent`, `secondaryIntents`, `summary` were written during deterministic sync | AI-derived fields belong primarily in `aiAnalysis` | `conversations` | EXTRA | Removed from deterministic conversation writes. |
| `followUpRequired` accepted caller input | `true` only when `status == WAITING_US` | `conversations` | PARTIAL MATCH | Derived solely from deterministic status. |
| `sleekflowUpdatedAt`, `lastSyncedAt`, `createdAt` absent | Schema v0.1 operational and audit timestamps | `conversations` | MISSING | Added. `createdAt` is only written when the Firestore document is first created. |
| Cursor, sync status, and update timestamp under `syncState/sleekflow` | Server-only SleekFlow checkpoint | `syncState` | MATCH | Retained; checkpoint updates only after a batch succeeds. |

Canonical collections remain `customers`, `conversations`, `customerEvents`, `aiAnalysis`, and `syncState`. This iteration writes only `customers`, `conversations`, and `syncState`.

## Deterministic conversation state

| State | Rule | followUpRequired |
| --- | --- | --- |
| `WAITING_US` | Latest valid message is from the customer and is not an acknowledgement-only terminal message following CS. | `true` |
| `WAITING_CUSTOMER` | Latest valid message is from CS. | `false` |
| `RESOLVED` | A customer acknowledgement-only message follows a CS response. | `false` |
| `UNCLEAR` | No usable customer or CS message, unknown direction, or insufficient message data. | `false` |

Acknowledgement matching is anchored to the complete normalized text rather than substring matching. It accepts examples such as `OK THX`, `收到，唔該晒🙏`, `👍`, and `❤️`; it rejects messages that include a new request, such as `Thanks，另外想問驗樓幾錢？`.

## Test result

Command:

```sh
npm run test:customer-master
```

Result: **22 passed, 0 failed**.

The regression suite covers acknowledgement-only resolution, acknowledgement plus a new request, inbound and outbound ordering, missing or unusable messages, customer deduplication, conversation-to-customer linkage, invalid phone rejection, and checkpoint safety.

## Ten-conversation dry run

Mode: read-only SleekFlow synchronization, capped at 10 conversations.

| Metric | Result |
| --- | ---: |
| Fetched | 10 |
| Eligible with valid phone | 10 |
| Skipped for missing or invalid phone | 0 |
| `WAITING_US` | 5 |
| `WAITING_CUSTOMER` | 3 |
| `RESOLVED` | 2 |
| `UNCLEAR` | 0 |

No Firestore writes were performed for this verification dry run. The dry-run output did not expose API credentials, phone numbers, conversation IDs, or message contents.

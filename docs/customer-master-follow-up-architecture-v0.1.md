# Customer Master Follow up Architecture v0.1

## Scope

This document describes the current deterministic operational path. It does not describe or authorize AI classification, auto-reply, webhooks, dashboards, or any expanded sync.

## Current path

```text
SleekFlow
  -> SleekFlow Client
  -> SleekFlow Adapter
  -> Customer Upsert
  -> Message State
  -> Conversation Upsert
  -> Firestore
  -> Follow-up Queue
```

1. `runtime/customer-master/sleekflow-client.js` reads SleekFlow conversations and messages.
2. `runtime/customer-master/sleekflow-adapter.js` is the only code that understands raw SleekFlow payloads. It maps customer and conversation inputs, parses usable customer/CS messages, and normalizes timestamps and senders.
3. `runtime/customer-master/customer-repository.js` deduplicates on `phoneNormalized` and creates canonical `cust_<uuid>` records.
4. `toOperationalMessageFields(messages)` calculates last inbound/outbound/latest operational fields. `isTerminalAcknowledgement(text)` detects acknowledgement-only terminal messages. Neither function uses AI.
5. `runtime/customer-master/conversation-repository.js` derives `followUpRequired` only from `status == WAITING_US` and upserts the canonical operational document.
6. `runtime/customer-master/follow-up-queue-repository.js` reads only `conversations` where `followUpRequired == true` and `status == WAITING_US`, joins `customers` for the display name and masked phone output, then sorts by priority and oldest waiting time.

## Review boundary

The message parser, acknowledgement detector, operational state calculation, `followUpRequired` derivation, and queue query are intentionally frozen for review on `feature/customer-master-v0.2-review`. This branch does not alter their business rules.

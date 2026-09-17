# Follow-up Engine v0.2

## Problem with v0.1

The v0.1 deterministic state logic treated the final usable message as the complete conversation decision. A customer acknowledgement could be misread when it was not evaluated with its preceding CS response, and non-text or unsupported provider placeholders could be treated too broadly as customer follow-up.

## Architecture change

Raw SleekFlow messages now pass through `runtime/customer-master/sleekflow-message-normalizer.js`. It is the only module that understands raw message fields. The adapter receives normalized messages, filters usable messages, groups consecutive messages into turns, and derives the deterministic operational state.

## Message normalization and usable filtering

Each normalized message contains `messageId`, `direction`, `timestamp`, `messageType`, `text`, and `isUsable`. System events, delivery/read receipts, internal notes, reactions, empty text messages, and the `<Unsupported Message Type>` placeholder are excluded. Non-text customer messages are retained as usable but result in a safe ambiguous/non-text outcome when they are the latest turn.

## Conversation turn logic

Consecutive usable messages from the same sender become one turn. A turn tracks its direction, start/end timestamps, constituent messages, and combined text. Terminal acknowledgement detection applies to the full final customer turn, not only its last message.

## Status decision tree

1. No usable messages: `UNCLEAR`.
2. Latest usable turn is CS: `WAITING_CUSTOMER`.
3. Latest customer turn follows CS and is acknowledgement-only: `RESOLVED`.
4. Latest customer turn contains a clear request, question, or action: `WAITING_US`.
5. Non-text or ambiguous final customer turns: `UNCLEAR`.

`followUpRequired` is true only for `WAITING_US`. Queue query semantics remain unchanged.

## Status reason codes

- `NO_USABLE_MESSAGES`
- `LATEST_TURN_CS`
- `CUSTOMER_TERMINAL_ACK`
- `CUSTOMER_REQUEST_AFTER_CS`
- `NON_TEXT_CUSTOMER_TURN`
- `AMBIGUOUS_CUSTOMER_TURN`

## Tests added

Tests cover raw-message filtering, non-text ambiguity, turn grouping, acknowledgement-only variants, acknowledgement with a new request, the current CS-last flow, unsupported/system/unknown messages, status reason codes, and all existing Customer Master and queue behaviours.

## QA output

Acceptance output now uses Hong Kong timestamps and exposes latest-turn visibility, prior-turn fields, status reason code, and message count when those values exist in Firestore. Legacy records that never stored this turn context show `null`; QA output remains read-only and never fabricates it. A read-only dry-run can expose the live computed turn context without persisting it.

## Known limitations

- The request detector is deterministic and intentionally narrow; it is not language understanding or AI.
- Existing Firestore records retain legacy data limitations until a separately approved controlled re-sync is performed.
- Turn context and reason codes are not added to the canonical Firestore conversation schema by this iteration.

## Next recommended step

Conduct manual QA on the dry-run turn output and approve deterministic edge cases before any separately authorized persistence or migration decision.

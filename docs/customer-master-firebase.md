# Customer Master Firebase Foundation

Firebase project: `lemma-customerdata`.

This repository adds the Phase 1 foundation described in the Supermama Customer Master specification:

- `customers` is the canonical customer record, keyed by an internal `cust_<uuid>` ID.
- `phoneNormalized` is the Hong Kong-first deduplication key. It is never used as a document ID.
- `conversations`, `customerEvents`, `aiAnalysis`, and server-only `syncState` are the remaining Phase 1 collections.
- Frontend clients have read-only access based on a `users/{uid}.role` document. SleekFlow sync and future Agent jobs use Firebase Admin SDK and bypass client rules.

## Local setup

1. In Firebase Console for `lemma-customerdata`, create a Cloud Firestore database in Production mode and choose the intended region. The region is permanent, so use the region closest to the operating team and required data residency.
2. Create a service account with the minimum server access needed for this development environment, then place its one-line JSON only in local `.env` as `FIREBASE_SERVICE_ACCOUNT_JSON`. Do not commit it.
3. Deploy `firestore.rules` and `firestore.indexes.json` after Firebase CLI authentication is available.
4. Run `npm run test:customer-master`.

## Implemented data-layer operations

- `upsertCustomer(db, contact)` creates or reuses a unique customer by `phoneNormalized` inside a Firestore transaction.
- `upsertConversation(db, conversation)` upserts the current operational state using the SleekFlow `conversationId` as the document ID.
- `saveSleekFlowCheckpoint(db, checkpoint)` writes the incremental cursor to `syncState/sleekflow` after a sync batch.

The next implementation unit is the SleekFlow API adapter that turns its Contact and Conversation payloads into these operations. API credentials stay server-side in `.env` or a production secret store.

## SleekFlow conversation client

`runtime/customer-master/sleekflow-client.js` implements the documented read-only endpoints:

- `GET /api/conversation/all?limit=<1-1000>&offset=<non-negative>`
- `GET /api/conversation/{conversationId}`
- `GET /api/conversation/message/{conversationId}`
- `GET /api/conversation/message/search?limit=<1-1000>&offset=<non-negative>`

Set `SLEEKFLOW_API_BASE_URL`, `SLEEKFLOW_API_KEY`, and, for this Mac, `SLEEKFLOW_PROXY_URL=http://127.0.0.1:7897` in local `.env`. The client uses the documented `X-Sleekflow-Api-Key` header and never logs responses or API keys.

## Safe first synchronization

Run `npm run sync:sleekflow:dry-run` first. The first development run is capped at 10 conversations and reports only aggregate counts plus normalized field names; it does not initialize Firestore or write data. After reviewing that result, run `npm run sync:sleekflow:apply` to create or update Customer Master and conversation documents, then save `syncState/sleekflow`.

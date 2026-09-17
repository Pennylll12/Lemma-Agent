const { FieldValue } = require("firebase-admin/firestore");

const CONVERSATION_STATUSES = new Set([
  "WAITING_US",
  "WAITING_CUSTOMER",
  "RESOLVED",
  "UNCLEAR",
]);

const PRIORITIES = new Set(["P0", "P1", "P2", "P3", "P4"]);
const MESSAGE_SENDERS = new Set(["CUSTOMER", "CS", null]);

function buildConversationDocument(input) {
  if (!input.conversationId) throw new TypeError("conversationId is required");
  if (!input.customerId) throw new TypeError("customerId is required");

  const status = input.status || "UNCLEAR";
  const priority = input.priority || "P4";
  const lastMessageSender = input.lastMessageSender || null;
  if (!CONVERSATION_STATUSES.has(status)) throw new RangeError("invalid conversation status");
  if (!PRIORITIES.has(priority)) throw new RangeError("invalid conversation priority");
  if (!MESSAGE_SENDERS.has(lastMessageSender)) throw new RangeError("invalid conversation message sender");

  return {
    conversationId: input.conversationId,
    customerId: input.customerId,
    channel: input.channel || "whatsapp",
    lastInboundAt: input.lastInboundAt || null,
    lastOutboundAt: input.lastOutboundAt || null,
    lastMessageAt: input.lastMessageAt || null,
    lastMessageSender,
    lastMessageText: input.lastMessageText || null,
    status,
    followUpRequired: status === "WAITING_US",
    priority,
    sleekflowUpdatedAt: input.sleekflowUpdatedAt || null,
    lastSyncedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function upsertConversation(db, input) {
  const document = buildConversationDocument(input);
  const ref = db.collection("conversations").doc(document.conversationId);
  await db.runTransaction(async transaction => {
    const current = await transaction.get(ref);
    transaction.set(ref, {
      ...document,
      ...(current.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    }, { merge: true });
  });
  return { conversationId: document.conversationId };
}

module.exports = {
  CONVERSATION_STATUSES,
  PRIORITIES,
  MESSAGE_SENDERS,
  buildConversationDocument,
  upsertConversation,
};

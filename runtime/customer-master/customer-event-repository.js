const { FieldValue } = require("firebase-admin/firestore");

const EVENT_SOURCES = new Set(["AI_DETECTION", "CS_MANUAL", "SLEEKFLOW", "SYSTEM"]);

// Foundation only: this module validates the canonical v0.1 shape but deliberately
// exposes no write operation until a real, reviewed business event requires one.
function buildCustomerEventDocument(input) {
  if (!input?.eventId || !String(input.eventId).startsWith("evt_")) {
    throw new TypeError("eventId must use the evt_ prefix");
  }
  if (!input.customerId) throw new TypeError("customerId is required");
  if (!input.type) throw new TypeError("type is required");
  if (!EVENT_SOURCES.has(input.source)) throw new RangeError("invalid customer event source");

  return {
    eventId: input.eventId,
    customerId: input.customerId,
    type: input.type,
    value: input.value ?? null,
    conversationId: input.conversationId ?? null,
    source: input.source,
    createdAt: FieldValue.serverTimestamp(),
  };
}

module.exports = { EVENT_SOURCES, buildCustomerEventDocument };

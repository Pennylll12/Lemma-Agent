const STATUS_MAP = Object.freeze({
  open: "WAITING_US",
  pending: "WAITING_CUSTOMER",
  closed: "RESOLVED",
});

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function mapConversationStatus(status) {
  return STATUS_MAP[String(status || "").toLowerCase()] || "UNCLEAR";
}

function mapSleekFlowConversation(source, customerId) {
  if (!source?.conversationId) throw new TypeError("SleekFlow conversationId is required");
  if (!customerId) throw new TypeError("customerId is required");

  const status = mapConversationStatus(source.status);
  return {
    conversationId: source.conversationId,
    customerId,
    lastMessageAt: toDate(source.updatedTime || source.modifiedAt),
    lastMessageSender: "system",
    // Message bodies are not persisted in v0.1; AI analysis will create summaries later.
    lastMessageText: null,
    status,
    primaryIntent: "OTHER",
    secondaryIntents: [],
    summary: null,
    followUpRequired: status === "WAITING_US",
    priority: status === "WAITING_US" ? "P3" : "P4",
  };
}

function mapSleekFlowContact(source) {
  const profile = source?.userProfile;
  if (!profile?.phoneNumber) return null;
  return {
    phone: profile.phoneNumber,
    name: profile.firstName || null,
  };
}

module.exports = { mapConversationStatus, mapSleekFlowConversation, mapSleekFlowContact };

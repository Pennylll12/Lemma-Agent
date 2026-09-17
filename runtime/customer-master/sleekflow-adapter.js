const { formatHongKongPhone, normalizePhone } = require("./phone-normalizer");

const STATUS_MAP = Object.freeze({ open: "WAITING_US", pending: "WAITING_CUSTOMER", closed: "RESOLVED" });

function mapConversationStatus(status) {
  return STATUS_MAP[String(status || "").toLowerCase()] || "UNCLEAR";
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

// This is the only module that understands SleekFlow's raw response shape.
function toCustomerInput(rawConversation) {
  const profile = rawConversation?.userProfile;
  if (!profile?.phoneNumber) return null;
  const phoneNormalized = normalizePhone(profile.phoneNumber);
  return {
    phone: phoneNormalized,
    phoneDisplay: formatHongKongPhone(phoneNormalized),
    name: profile.firstName || null,
  };
}

function toConversationInput(rawConversation, customerId) {
  if (!rawConversation?.conversationId) throw new TypeError("SleekFlow conversationId is required");
  if (!customerId) throw new TypeError("customerId is required");
  return {
    conversationId: rawConversation.conversationId,
    customerId,
    channel: String(rawConversation.lastMessageChannel || rawConversation.conversationChannels?.[0]?.channelName || "whatsapp").toLowerCase(),
    sleekflowUpdatedAt: toDate(rawConversation.updatedTime || rawConversation.modifiedAt),
    priority: "P4",
  };
}

function toMessageDate(message) {
  if (typeof message?.timestamp === "number") {
    return new Date(message.timestamp < 100_000_000_000 ? message.timestamp * 1000 : message.timestamp);
  }
  return toDate(message?.createdAt || message?.updatedAt);
}

function messageDirection(message) {
  if (message?.isSentFromSleekflow === true) return "cs";
  if (message?.isSentFromSleekflow === false) return "customer";
  return null;
}

function textFromMessage(message) {
  return typeof message?.messageContent === "string" ? message.messageContent.trim().slice(0, 500) || null : null;
}

function isTerminalAcknowledgement(text) {
  if (!text) return false;
  const withoutEmoji = text.replace(/[\p{Extended_Pictographic}\p{Emoji_Component}\uFE0F]/gu, " ");
  const normalized = withoutEmoji
    .trim()
    .toLowerCase()
    .replace(/[.!！?？,，、;；:：…\s]+/g, " ")
    .trim();
  if (!normalized) return /[\p{Extended_Pictographic}\p{Emoji_Component}]/u.test(text);

  const acknowledgement = "(?:thanks|thank you|thankyou|thx|ok|okay|received|收到|唔該晒|唔該|謝謝|谢谢|好呀)";
  return new RegExp(`^${acknowledgement}(?: ${acknowledgement})*$`, "u").test(normalized);
}

function toOperationalMessageFields(rawMessages) {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return { lastInboundAt: null, lastOutboundAt: null, lastMessageAt: null, lastMessageSender: null, lastMessageText: null, status: "UNCLEAR", followUpRequired: false };
  }

  const messages = rawMessages
    .map(message => ({ message, direction: messageDirection(message), at: toMessageDate(message) }))
    .filter(item => item.direction && item.at && !Number.isNaN(item.at.valueOf()))
    .sort((a, b) => a.at - b.at);
  if (!messages.length) {
    return { lastInboundAt: null, lastOutboundAt: null, lastMessageAt: null, lastMessageSender: null, lastMessageText: null, status: "UNCLEAR", followUpRequired: false };
  }

  const inbound = messages.filter(item => item.direction === "customer").at(-1);
  const outbound = messages.filter(item => item.direction === "cs").at(-1);
  const latest = messages.at(-1);
  const latestText = textFromMessage(latest.message);
  const resolved = latest.direction === "customer" && Boolean(outbound) && outbound.at < latest.at && isTerminalAcknowledgement(latestText);
  const status = resolved ? "RESOLVED" : latest.direction === "customer" ? "WAITING_US" : "WAITING_CUSTOMER";

  return {
    lastInboundAt: inbound?.at || null,
    lastOutboundAt: outbound?.at || null,
    lastMessageAt: latest.at,
    lastMessageSender: latest.direction === "customer" ? "CUSTOMER" : "CS",
    lastMessageText: latestText,
    status,
    followUpRequired: status === "WAITING_US",
  };
}

module.exports = { mapConversationStatus, toCustomerInput, toConversationInput, toOperationalMessageFields, isTerminalAcknowledgement };

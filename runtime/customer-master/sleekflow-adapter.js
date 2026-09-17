const { formatHongKongPhone, normalizePhone } = require("./phone-normalizer");
const { normalizeSleekFlowMessage } = require("./sleekflow-message-normalizer");

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

function isTerminalAcknowledgement(text) {
  if (!text) return false;
  const withoutEmoji = text.replace(/[\p{Extended_Pictographic}\p{Emoji_Component}\uFE0F]/gu, " ");
  const normalized = withoutEmoji
    .trim()
    .toLowerCase()
    .replace(/[.!！?？,，、;；:：…\s]+/g, " ")
    .trim();
  if (!normalized) return /[\p{Extended_Pictographic}\p{Emoji_Component}]/u.test(text);

  const acknowledgement = "(?:thanks|thank you|thankyou|thx|ok|okay|received|收到|唔該晒|唔該|多謝|多谢|謝謝你|谢谢你|謝謝|谢谢|明白|好的|知道了|了解|好呀)";
  return new RegExp(`^${acknowledgement}(?: ${acknowledgement})*$`, "u").test(normalized);
}

function buildConversationTurns(normalizedMessages) {
  const usable = normalizedMessages
    .filter(message => message.isUsable)
    .sort((left, right) => left.timestamp - right.timestamp);
  const turns = [];
  for (const message of usable) {
    const previous = turns.at(-1);
    if (!previous || previous.direction !== message.direction) {
      turns.push({ direction: message.direction, startedAt: message.timestamp, endedAt: message.timestamp, messages: [message], combinedText: message.text || null });
      continue;
    }
    previous.endedAt = message.timestamp;
    previous.messages.push(message);
    previous.combinedText = previous.messages.map(item => item.text).filter(Boolean).join("\n") || null;
  }
  return turns;
}

function customerTurnIsNonText(turn) {
  return turn.messages.some(message => !message.text);
}

function hasClearCustomerRequest(text) {
  if (!text) return false;
  return /[?？]|想問|請問|想知道|可唔可以|可否|幾時|幾錢|幾多|點樣|點搞|安排|預約|book|加入.*group|加我.*group|幫我/.test(text);
}

function unclearState(reason) {
  return {
    status: "UNCLEAR",
    followUpRequired: false,
    statusReasonCode: reason,
  };
}

function toOperationalMessageFields(rawMessages) {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return { lastInboundAt: null, lastOutboundAt: null, lastMessageAt: null, lastMessageSender: null, lastMessageText: null, messageCountUsedForStatus: 0, ...unclearState("NO_USABLE_MESSAGES") };
  }

  const normalizedMessages = rawMessages.map(normalizeSleekFlowMessage);
  const turns = buildConversationTurns(normalizedMessages);
  const usableMessages = turns.flatMap(turn => turn.messages);
  if (!turns.length) {
    return { lastInboundAt: null, lastOutboundAt: null, lastMessageAt: null, lastMessageSender: null, lastMessageText: null, messageCountUsedForStatus: 0, ...unclearState("NO_USABLE_MESSAGES") };
  }

  const inbound = usableMessages.filter(message => message.direction === "CUSTOMER").at(-1);
  const outbound = usableMessages.filter(message => message.direction === "CS").at(-1);
  const latestTurn = turns.at(-1);
  const previousTurn = turns.at(-2);
  const latestMessage = latestTurn.messages.at(-1);
  let decision;
  if (latestTurn.direction === "CS") {
    decision = { status: "WAITING_CUSTOMER", followUpRequired: false, statusReasonCode: "LATEST_TURN_CS" };
  } else if (customerTurnIsNonText(latestTurn)) {
    decision = unclearState("NON_TEXT_CUSTOMER_TURN");
  } else if (previousTurn?.direction === "CS" && isTerminalAcknowledgement(latestTurn.combinedText)) {
    decision = { status: "RESOLVED", followUpRequired: false, statusReasonCode: "CUSTOMER_TERMINAL_ACK" };
  } else if (hasClearCustomerRequest(latestTurn.combinedText)) {
    decision = { status: "WAITING_US", followUpRequired: true, statusReasonCode: "CUSTOMER_REQUEST_AFTER_CS" };
  } else {
    decision = unclearState("AMBIGUOUS_CUSTOMER_TURN");
  }

  return {
    lastInboundAt: inbound?.timestamp || null,
    lastOutboundAt: outbound?.timestamp || null,
    lastMessageAt: latestTurn.endedAt,
    lastMessageSender: latestTurn.direction,
    lastMessageText: latestMessage.text?.slice(0, 500) || null,
    messageCountUsedForStatus: usableMessages.length,
    ...decision,
  };
}

module.exports = { mapConversationStatus, toCustomerInput, toConversationInput, toOperationalMessageFields, isTerminalAcknowledgement, buildConversationTurns, hasClearCustomerRequest };

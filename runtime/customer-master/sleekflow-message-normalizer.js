const NON_USABLE_MESSAGE_TYPES = new Set(["system", "event", "receipt", "delivery_receipt", "read_receipt", "reaction", "internal_note", "note"]);
const NON_TEXT_MESSAGE_TYPES = new Set(["image", "voice", "audio", "document", "file", "video", "sticker"]);

function toMessageTimestamp(rawMessage) {
  if (typeof rawMessage?.timestamp === "number") {
    return new Date(rawMessage.timestamp < 100_000_000_000 ? rawMessage.timestamp * 1000 : rawMessage.timestamp);
  }
  const timestamp = new Date(rawMessage?.createdAt || rawMessage?.updatedAt);
  return Number.isNaN(timestamp.valueOf()) ? null : timestamp;
}

function normalizeDirection(rawMessage) {
  if (rawMessage?.isSentFromSleekflow === true) return "CS";
  if (rawMessage?.isSentFromSleekflow === false) return "CUSTOMER";
  return null;
}

function normalizeMessageType(rawMessage) {
  return String(rawMessage?.messageType || "unknown").trim().toLowerCase() || "unknown";
}

function normalizeText(rawMessage) {
  if (typeof rawMessage?.messageContent !== "string") return null;
  const text = rawMessage.messageContent.trim();
  return text || null;
}

function isInternal(rawMessage) {
  return rawMessage?.isInternal === true || rawMessage?.metadata?.isInternal === true || rawMessage?.metadata?.internalNote === true;
}

// This is the only module that understands raw SleekFlow message payloads.
function normalizeSleekFlowMessage(rawMessage) {
  const messageType = normalizeMessageType(rawMessage);
  const text = normalizeText(rawMessage);
  const timestamp = toMessageTimestamp(rawMessage);
  const direction = normalizeDirection(rawMessage);
  const placeholder = text?.toLowerCase() === "<unsupported message type>";
  const nonText = NON_TEXT_MESSAGE_TYPES.has(messageType) || Boolean(rawMessage?.uploadedFiles?.length);
  const excluded = !direction || !timestamp || NON_USABLE_MESSAGE_TYPES.has(messageType) || isInternal(rawMessage) || placeholder;
  const isUsable = !excluded && (Boolean(text) || nonText);

  return {
    messageId: rawMessage?.id || rawMessage?.messageUniqueID || null,
    direction,
    timestamp,
    messageType,
    text,
    isUsable,
    contentMetadata: nonText ? { hasUploadedFiles: Boolean(rawMessage?.uploadedFiles?.length) } : null,
  };
}

module.exports = {
  NON_TEXT_MESSAGE_TYPES,
  NON_USABLE_MESSAGE_TYPES,
  normalizeSleekFlowMessage,
};

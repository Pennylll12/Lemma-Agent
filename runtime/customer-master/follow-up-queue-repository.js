const PRIORITIES = Object.freeze(["P0", "P1", "P2", "P3", "P4"]);
const DEFAULT_PRIORITY = "P3";

function normalizePriority(priority) {
  return PRIORITIES.includes(priority) ? priority : DEFAULT_PRIORITY;
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function waitingDuration(lastMessageAt, now = new Date()) {
  const date = toDate(lastMessageAt);
  if (!date) return { waitingMinutes: null, waitingHours: null };
  const waitingMinutes = Math.max(0, Math.floor((now.valueOf() - date.valueOf()) / 60_000));
  return { waitingMinutes, waitingHours: Number((waitingMinutes / 60).toFixed(2)) };
}

function buildQueueItem(conversation, customer, now = new Date()) {
  const lastInboundAt = toDate(conversation.lastInboundAt);
  const lastOutboundAt = toDate(conversation.lastOutboundAt);
  const lastMessageAt = toDate(conversation.lastMessageAt);
  return {
    conversationId: conversation.conversationId,
    customerId: conversation.customerId || null,
    phoneDisplay: customer?.phoneDisplay || null,
    customerName: customer?.name || null,
    customerMissing: !customer,
    channel: conversation.channel || "whatsapp",
    status: conversation.status,
    priority: normalizePriority(conversation.priority),
    lastInboundAt,
    lastOutboundAt,
    lastMessageAt,
    lastMessageSender: conversation.lastMessageSender || null,
    lastMessageText: conversation.lastMessageText || null,
    ...waitingDuration(lastMessageAt, now),
  };
}

function compareQueueItems(left, right) {
  const priorityDelta = PRIORITIES.indexOf(left.priority) - PRIORITIES.indexOf(right.priority);
  if (priorityDelta) return priorityDelta;

  const leftTime = left.lastMessageAt?.valueOf() ?? Number.POSITIVE_INFINITY;
  const rightTime = right.lastMessageAt?.valueOf() ?? Number.POSITIVE_INFINITY;
  if (leftTime !== rightTime) return leftTime - rightTime;
  return String(left.conversationId).localeCompare(String(right.conversationId));
}

function summarizeQueue(items) {
  const priorityCounts = Object.fromEntries(PRIORITIES.map(priority => [priority, 0]));
  for (const item of items) priorityCounts[item.priority] += 1;
  const waitingHours = items.map(item => item.waitingHours).filter(hours => hours !== null);
  return {
    totalWaiting: items.length,
    ...priorityCounts,
    oldestWaitingHours: waitingHours.length ? Math.max(...waitingHours) : null,
  };
}

async function listFollowUpQueue(db, { limit = 50, now = new Date() } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new RangeError("limit must be an integer from 1 to 500");
  }

  const snapshot = await db
    .collection("conversations")
    .where("followUpRequired", "==", true)
    .where("status", "==", "WAITING_US")
    .get();

  const conversations = snapshot.docs.map(doc => ({ conversationId: doc.id, ...doc.data() }));
  const customerById = new Map();
  await Promise.all([...new Set(conversations.map(item => item.customerId).filter(Boolean))].map(async customerId => {
    const customer = await db.collection("customers").doc(customerId).get();
    if (customer.exists) customerById.set(customerId, customer.data());
  }));

  const allItems = conversations
    .map(conversation => buildQueueItem(conversation, customerById.get(conversation.customerId), now))
    .sort(compareQueueItems);

  return { summary: summarizeQueue(allItems), items: allItems.slice(0, limit) };
}

function maskPhoneDisplay(phoneDisplay) {
  if (!phoneDisplay) return null;
  const digits = String(phoneDisplay).replace(/\D/g, "");
  const local = digits.length >= 8 ? digits.slice(-8) : digits;
  if (!local) return null;
  return `${local.slice(0, Math.min(4, local.length))}${"*".repeat(Math.max(4, local.length - 4))}`;
}

function safeCustomerName(customerName) {
  if (!customerName) return null;
  const name = String(customerName).trim();
  return name.replace(/\D/g, "").length >= 8 ? null : name;
}

function compactMessageText(text, maxLength = 120) {
  if (!text) return null;
  const normalized = String(text).replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

module.exports = {
  DEFAULT_PRIORITY,
  PRIORITIES,
  normalizePriority,
  waitingDuration,
  buildQueueItem,
  compareQueueItems,
  summarizeQueue,
  listFollowUpQueue,
  maskPhoneDisplay,
  safeCustomerName,
  compactMessageText,
};

const { getCustomerMasterDb } = require("./firebase-admin");
const { compactMessageText, listFollowUpQueue, maskPhoneDisplay, safeCustomerName } = require("./follow-up-queue-repository");

function formatHongKongTime(date) {
  if (!date) return null;
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

function displaySender(sender) {
  const normalized = String(sender || "").toUpperCase();
  return normalized === "CUSTOMER" || normalized === "CS" ? normalized : null;
}

function toAcceptanceSummary(summary, items) {
  return {
    totalWaiting: summary.totalWaiting,
    priorityCounts: {
      P0: summary.P0,
      P1: summary.P1,
      P2: summary.P2,
      P3: summary.P3,
      P4: summary.P4,
    },
    oldestWaitingHours: summary.oldestWaitingHours,
    missingCustomerCount: items.filter(item => item.customerMissing).length,
  };
}

function toAcceptanceItem(item) {
  const latestTurnDirection = displaySender(item.lastMessageSender);
  const latestTurnPreview = compactMessageText(item.lastMessageText, 80);
  return {
    conversationId: item.conversationId,
    maskedPhone: maskPhoneDisplay(item.phoneDisplay),
    customerName: safeCustomerName(item.customerName),
    lastInboundAt: formatHongKongTime(item.lastInboundAt),
    lastOutboundAt: formatHongKongTime(item.lastOutboundAt),
    lastMessageAt: formatHongKongTime(item.lastMessageAt),
    waitingHours: item.waitingHours,
    latestTurnDirection,
    latestTurnPreview,
    previousTurnDirection: null,
    previousTurnPreview: null,
    usableMessagePreviews: latestTurnDirection && item.lastMessageAt ? [{
      sender: latestTurnDirection,
      at: formatHongKongTime(item.lastMessageAt),
      preview: latestTurnPreview,
    }] : [],
    messageCountUsedForStatus: item.messageCountUsedForStatus ?? null,
    statusReasonCode: item.statusReasonCode ?? null,
    status: item.status,
    expectedHumanStatus: "",
    reviewResult: "",
    reviewNote: "",
    // These fields are retained from the first acceptance version for operational context.
    priority: item.priority,
    customerMissing: item.customerMissing,
  };
}

async function main() {
  require("dotenv").config({ quiet: true });
  const { summary, items } = await listFollowUpQueue(getCustomerMasterDb(), { limit: 20 });
  console.log(JSON.stringify({ acceptanceSummary: toAcceptanceSummary(summary, items) }));
  for (const item of items) console.log(JSON.stringify(toAcceptanceItem(item)));
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { formatHongKongTime, displaySender, toAcceptanceSummary, toAcceptanceItem };

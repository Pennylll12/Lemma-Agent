const { getCustomerMasterDb } = require("./firebase-admin");
const { compactMessageText, listFollowUpQueue, maskPhoneDisplay } = require("./follow-up-queue-repository");

function toCliItem(item) {
  return {
    conversationId: item.conversationId,
    customerId: item.customerId,
    phoneDisplay: maskPhoneDisplay(item.phoneDisplay),
    customerName: item.customerName,
    customerMissing: item.customerMissing,
    channel: item.channel,
    status: item.status,
    priority: item.priority,
    lastMessageAt: item.lastMessageAt?.toISOString() || null,
    lastMessageText: compactMessageText(item.lastMessageText),
    waitingMinutes: item.waitingMinutes,
    waitingHours: item.waitingHours,
  };
}

async function main() {
  require("dotenv").config({ quiet: true });
  const { summary, items } = await listFollowUpQueue(getCustomerMasterDb(), { limit: 50 });
  console.log(JSON.stringify({ summary }));
  for (const item of items) console.log(JSON.stringify(toCliItem(item)));
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { toCliItem };

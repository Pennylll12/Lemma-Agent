const { getCustomerMasterDb } = require("./firebase-admin");
const { upsertCustomer } = require("./customer-repository");
const { upsertConversation } = require("./conversation-repository");
const { saveSleekFlowCheckpoint } = require("./sync-state-repository");
const { createSleekFlowClient } = require("./sleekflow-client");
const { toCustomerInput, toConversationInput, toOperationalMessageFields } = require("./sleekflow-adapter");

const DRY_RUN_FIELDS = Object.freeze({
  customer: ["phone", "phoneDisplay", "name"],
  conversation: ["conversationId", "customerId", "channel", "lastInboundAt", "lastOutboundAt", "lastMessageAt", "lastMessageSender", "lastMessageText", "status", "followUpRequired", "priority", "sleekflowUpdatedAt"],
});

async function syncConversationPage({
  client,
  db,
  limit = 10,
  offset = 0,
  apply = false,
  adapter = { toCustomerInput, toConversationInput, toOperationalMessageFields },
  upsertCustomerFn = upsertCustomer,
  upsertConversationFn = upsertConversation,
  saveCheckpointFn = saveSleekFlowCheckpoint,
}) {
  const conversations = await client.listConversations({ limit, offset });
  if (!Array.isArray(conversations)) throw new TypeError("SleekFlow conversations response must be an array");

  const result = { fetched: conversations.length, eligible: 0, skippedNoPhone: 0, createdCustomers: 0, updatedCustomers: 0, writtenConversations: 0, statusCounts: { WAITING_US: 0, WAITING_CUSTOMER: 0, RESOLVED: 0, UNCLEAR: 0 } };
  for (const source of conversations) {
    let contact;
    try {
      contact = adapter.toCustomerInput(source);
    } catch (error) {
      result.skippedNoPhone += 1;
      continue;
    }
    if (!contact) {
      result.skippedNoPhone += 1;
      continue;
    }
    result.eligible += 1;
    const messages = await client.getConversationMessages(source.conversationId);
    const operational = adapter.toOperationalMessageFields(messages);
    result.statusCounts[operational.status] += 1;

    if (!apply) continue;
    const customer = await upsertCustomerFn(db, contact);
    if (customer.created) result.createdCustomers += 1;
    else result.updatedCustomers += 1;
    await upsertConversationFn(db, {
      ...adapter.toConversationInput(source, customer.customerId),
      ...operational,
    });
    result.writtenConversations += 1;
  }

  if (apply) {
    await saveCheckpointFn(db, {
      cursor: String(offset + conversations.length),
      lastSyncAt: new Date(),
      status: "success",
    });
  }
  return result;
}

async function main() {
  require("dotenv").config({ quiet: true });
  const apply = process.argv.includes("--apply");
  const client = createSleekFlowClient();
  const db = apply ? getCustomerMasterDb() : null;
  const result = await syncConversationPage({ client, db, apply });
  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    normalizedFields: DRY_RUN_FIELDS,
    ...result,
  }));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { DRY_RUN_FIELDS, syncConversationPage };

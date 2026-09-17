const test = require("node:test");
const assert = require("node:assert/strict");
const { syncConversationPage } = require("./sleekflow-sync");

function conversation(id, phone) {
  return { conversationId: id, status: "open", updatedTime: "2026-09-17T00:00:00Z", userProfile: phone ? { phoneNumber: phone, firstName: "Name" } : {} };
}

function clientFor(items) {
  return { listConversations: async () => items, getConversationMessages: async () => [] };
}

test("same phone reuses one customer across conversations", async () => {
  const customers = new Map();
  const written = [];
  const result = await syncConversationPage({
    client: clientFor([conversation("c1", "+852 9123 4567"), conversation("c2", "91234567")]), db: {}, apply: true,
    upsertCustomerFn: async (_db, input) => {
      const created = !customers.has(input.phone);
      const customerId = customers.get(input.phone) || "cust_shared";
      customers.set(input.phone, customerId);
      return { customerId, created };
    },
    upsertConversationFn: async (_db, input) => written.push(input),
    saveCheckpointFn: async () => {},
  });
  assert.equal(customers.size, 1);
  assert.deepEqual(written.map(item => item.customerId), ["cust_shared", "cust_shared"]);
  assert.equal(result.createdCustomers, 1);
  assert.equal(result.updatedCustomers, 1);
});

test("different conversation IDs map to the same customer", async () => {
  const written = [];
  await syncConversationPage({
    client: clientFor([conversation("c1", "91234567"), conversation("c2", "91234567")]), db: {}, apply: true,
    upsertCustomerFn: async () => ({ customerId: "cust_1", created: false }),
    upsertConversationFn: async (_db, input) => written.push(input), saveCheckpointFn: async () => {},
  });
  assert.deepEqual(written.map(item => item.conversationId), ["c1", "c2"]);
  assert.ok(written.every(item => item.customerId === "cust_1"));
});

test("missing phone never creates an invalid customer", async () => {
  let customerCalls = 0;
  const result = await syncConversationPage({
    client: clientFor([conversation("c1", null)]), db: {}, apply: true,
    upsertCustomerFn: async () => { customerCalls += 1; }, upsertConversationFn: async () => {}, saveCheckpointFn: async () => {},
  });
  assert.equal(customerCalls, 0);
  assert.equal(result.skippedNoPhone, 1);
});

test("checkpoint updates only after every batch write succeeds", async () => {
  let checkpointCalls = 0;
  await assert.rejects(() => syncConversationPage({
    client: clientFor([conversation("c1", "91234567"), conversation("c2", "92345678")]), db: {}, apply: true,
    upsertCustomerFn: async () => ({ customerId: "cust_1", created: false }),
    upsertConversationFn: async (_db, input) => { if (input.conversationId === "c2") throw new Error("write failed"); },
    saveCheckpointFn: async () => { checkpointCalls += 1; },
  }), /write failed/);
  assert.equal(checkpointCalls, 0);
});

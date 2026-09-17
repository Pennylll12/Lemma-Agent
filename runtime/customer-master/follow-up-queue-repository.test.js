const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildQueueItem,
  compactMessageText,
  listFollowUpQueue,
  maskPhoneDisplay,
  waitingDuration,
} = require("./follow-up-queue-repository");

function createDb(conversations, customers = {}) {
  const docs = conversations.map(item => ({ id: item.conversationId, data: () => item }));
  return {
    collection(name) {
      if (name === "conversations") {
        const filters = [];
        const query = {
          where(field, operator, value) {
            filters.push({ field, operator, value });
            return query;
          },
          get: async () => ({ docs: docs.filter(doc => filters.every(filter => doc.data()[filter.field] === filter.value)) }),
        };
        return query;
      }
      if (name === "customers") return { doc: id => ({ get: async () => ({ exists: Boolean(customers[id]), data: () => customers[id] }) }) };
      throw new Error(`unexpected collection ${name}`);
    },
  };
}

function conversation(conversationId, overrides = {}) {
  return {
    conversationId,
    customerId: "cust_1",
    followUpRequired: true,
    status: "WAITING_US",
    priority: "P3",
    channel: "whatsapp",
    lastInboundAt: new Date("2026-09-16T23:59:00Z"),
    lastOutboundAt: new Date("2026-09-16T23:58:00Z"),
    lastMessageAt: new Date("2026-09-17T00:00:00Z"),
    lastMessageSender: "CUSTOMER",
    lastMessageText: "Need CS help",
    ...overrides,
  };
}

test("WAITING_US conversations with follow-up required are included", async () => {
  const { items } = await listFollowUpQueue(createDb([conversation("c1")]), { now: new Date("2026-09-17T01:00:00Z") });
  assert.equal(items.length, 1);
  assert.equal(items[0].conversationId, "c1");
});

test("WAITING_CUSTOMER, RESOLVED, and UNCLEAR conversations are excluded", async () => {
  const { items } = await listFollowUpQueue(createDb([
    conversation("waiting-us"),
    conversation("waiting-customer", { status: "WAITING_CUSTOMER", followUpRequired: false }),
    conversation("resolved", { status: "RESOLVED", followUpRequired: false }),
    conversation("unclear", { status: "UNCLEAR", followUpRequired: false }),
  ]));
  assert.deepEqual(items.map(item => item.conversationId), ["waiting-us"]);
});

test("missing priority defaults to P3 and older items sort first within a priority", async () => {
  const { items } = await listFollowUpQueue(createDb([
    conversation("newer", { priority: undefined, lastMessageAt: new Date("2026-09-17T02:00:00Z") }),
    conversation("older", { priority: "P3", lastMessageAt: new Date("2026-09-17T01:00:00Z") }),
  ]), { now: new Date("2026-09-17T03:00:00Z") });
  assert.deepEqual(items.map(item => item.conversationId), ["older", "newer"]);
  assert.equal(items[1].priority, "P3");
});

test("summary covers all waiting records even when the displayed queue is limited", async () => {
  const { summary, items } = await listFollowUpQueue(createDb([
    conversation("c1", { priority: "P0" }),
    conversation("c2", { priority: "P3" }),
  ]), { limit: 1 });
  assert.equal(summary.totalWaiting, 2);
  assert.equal(summary.P0, 1);
  assert.equal(summary.P3, 1);
  assert.equal(items.length, 1);
  assert.equal(items[0].conversationId, "c1");
});

test("missing customer documents do not crash queue construction", async () => {
  const { items } = await listFollowUpQueue(createDb([conversation("c1", { customerId: "cust_missing" })]));
  assert.equal(items[0].customerMissing, true);
  assert.equal(items[0].phoneDisplay, null);
});

test("waiting duration is calculated at output time", () => {
  assert.deepEqual(waitingDuration(new Date("2026-09-17T00:00:00Z"), new Date("2026-09-17T02:30:59Z")), { waitingMinutes: 150, waitingHours: 2.5 });
  assert.deepEqual(waitingDuration(null, new Date()), { waitingMinutes: null, waitingHours: null });
});

test("phone display is masked and message text is compacted", () => {
  assert.equal(maskPhoneDisplay("+852 9123 4567"), "9123****");
  assert.equal(maskPhoneDisplay(null), null);
  assert.equal(compactMessageText("a".repeat(121)), `${"a".repeat(119)}…`);
});

test("queue item returns only operational customer fields", () => {
  const item = buildQueueItem(conversation("c1"), { phoneDisplay: "+852 9123 4567", name: "Customer", phoneNormalized: "85291234567" }, new Date("2026-09-17T01:00:00Z"));
  assert.equal(item.phoneDisplay, "+852 9123 4567");
  assert.ok(!Object.hasOwn(item, "phoneNormalized"));
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { EVENT_SOURCES, buildCustomerEventDocument } = require("./customer-event-repository");

test("customer event foundation accepts only canonical v0.1 fields", () => {
  const event = buildCustomerEventDocument({
    eventId: "evt_test",
    customerId: "cust_test",
    type: "JOINED_GROUP",
    value: { group: "test" },
    conversationId: "conversation_test",
    source: "SYSTEM",
  });
  assert.deepEqual(EVENT_SOURCES, new Set(["AI_DETECTION", "CS_MANUAL", "SLEEKFLOW", "SYSTEM"]));
  assert.equal(event.eventId, "evt_test");
  assert.equal(event.source, "SYSTEM");
  assert.ok(Object.hasOwn(event, "createdAt"));
  assert.ok(!Object.hasOwn(event, "confidence"));
});

test("customer event foundation rejects incomplete or invalid events", () => {
  assert.throws(() => buildCustomerEventDocument({ customerId: "cust", type: "JOINED_GROUP", source: "SYSTEM" }), TypeError);
  assert.throws(() => buildCustomerEventDocument({ eventId: "evt_x", customerId: "cust", type: "JOINED_GROUP", source: "UNKNOWN" }), RangeError);
});

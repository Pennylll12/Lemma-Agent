const test = require("node:test");
const assert = require("node:assert/strict");
const { formatHongKongTime, toAcceptanceItem, toAcceptanceSummary } = require("./follow-up-queue-acceptance");

test("acceptance output is masked, compact, and contains manual QA placeholders", () => {
  const item = toAcceptanceItem({
    conversationId: "conversation-1",
    phoneDisplay: "+852 9123 4567",
    customerName: "Customer",
    priority: "P3",
    status: "WAITING_US",
    lastMessageAt: new Date("2026-09-17T00:00:00Z"),
    lastInboundAt: new Date("2026-09-16T23:59:00Z"),
    lastOutboundAt: new Date("2026-09-16T23:58:00Z"),
    lastMessageSender: "customer",
    waitingHours: 2.5,
    lastMessageText: "a".repeat(81),
    customerMissing: false,
  });

  assert.equal(item.maskedPhone, "9123****");
  assert.equal(item.lastMessagePreview, `${"a".repeat(79)}…`);
  assert.equal(item.lastInboundAt, "2026-09-17 07:59:00");
  assert.equal(item.lastOutboundAt, "2026-09-17 07:58:00");
  assert.equal(item.lastMessageAt, "2026-09-17 08:00:00");
  assert.equal(item.lastMessageSender, "CUSTOMER");
  assert.equal(item.previousMessageSender, null);
  assert.equal(item.messageCountUsedForStatus, null);
  assert.equal(item.statusReason, "Latest customer message is not terminal acknowledgement");
  assert.deepEqual(item.usableMessagePreviews, [{ sender: "CUSTOMER", at: "2026-09-17 08:00:00", preview: `${"a".repeat(79)}…` }]);
  assert.equal(item.expectedHumanStatus, "");
  assert.equal(item.reviewResult, "");
  assert.equal(item.reviewNote, "");
  assert.ok(!Object.hasOwn(item, "phoneNormalized"));
});

test("Hong Kong timestamp formatter safely leaves unavailable timestamps blank", () => {
  assert.equal(formatHongKongTime(null), null);
});

test("acceptance summary contains aggregate priority and missing-customer counts", () => {
  const summary = toAcceptanceSummary({ totalWaiting: 3, P0: 1, P1: 0, P2: 0, P3: 2, P4: 0, oldestWaitingHours: 4 }, [
    { customerMissing: false }, { customerMissing: true },
  ]);
  assert.deepEqual(summary, {
    totalWaiting: 3,
    priorityCounts: { P0: 1, P1: 0, P2: 0, P3: 2, P4: 0 },
    oldestWaitingHours: 4,
    missingCustomerCount: 1,
  });
});

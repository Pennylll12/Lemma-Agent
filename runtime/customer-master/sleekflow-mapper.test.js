const test = require("node:test");
const assert = require("node:assert/strict");
const { mapConversationStatus, mapSleekFlowContact, mapSleekFlowConversation } = require("./sleekflow-mapper");

test("maps SleekFlow statuses conservatively", () => {
  assert.equal(mapConversationStatus("open"), "WAITING_US");
  assert.equal(mapConversationStatus("pending"), "WAITING_CUSTOMER");
  assert.equal(mapConversationStatus("closed"), "RESOLVED");
  assert.equal(mapConversationStatus("unexpected"), "UNCLEAR");
});

test("maps only phone-backed profiles and never copies message bodies", () => {
  const source = { conversationId: "c1", status: "open", updatedTime: "2026-09-17T00:00:00Z", userProfile: { phoneNumber: "+852 9123 4567", firstName: "陳小姐" } };
  assert.deepEqual(mapSleekFlowContact(source), { phone: "+852 9123 4567", name: "陳小姐" });
  assert.equal(mapSleekFlowContact({ userProfile: {} }), null);
  const mapped = mapSleekFlowConversation(source, "cust_1");
  assert.equal(mapped.followUpRequired, true);
  assert.equal(mapped.priority, "P3");
  assert.equal(mapped.lastMessageText, null);
});

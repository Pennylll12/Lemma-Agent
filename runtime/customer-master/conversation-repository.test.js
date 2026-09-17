const test = require("node:test");
const assert = require("node:assert/strict");
const { buildConversationDocument } = require("./conversation-repository");

test("conversation defaults remain safe until the rule engine has classified it", () => {
  const conversation = buildConversationDocument({
    conversationId: "sleekflow-123",
    customerId: "cust_123",
  });

  assert.equal(conversation.channel, "whatsapp");
  assert.equal(conversation.status, "UNCLEAR");
  assert.equal(conversation.priority, "P4");
  assert.equal(conversation.lastMessageSender, null);
  assert.equal(conversation.followUpRequired, false);
  assert.ok(Object.hasOwn(conversation, "lastSyncedAt"));
  assert.ok(!Object.hasOwn(conversation, "primaryIntent"));
});

test("conversation requires a SleekFlow ID and linked customer", () => {
  assert.throws(() => buildConversationDocument({ customerId: "cust_123" }), TypeError);
  assert.throws(() => buildConversationDocument({ conversationId: "conversation" }), TypeError);
  assert.throws(() => buildConversationDocument({ conversationId: "conversation", customerId: "cust", status: "OPEN" }), RangeError);
  assert.throws(() => buildConversationDocument({ conversationId: "conversation", customerId: "cust", lastMessageSender: "customer" }), RangeError);
});

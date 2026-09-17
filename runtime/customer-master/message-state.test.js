const test = require("node:test");
const assert = require("node:assert/strict");
const { buildConversationTurns, toOperationalMessageFields } = require("./sleekflow-adapter");
const { normalizeSleekFlowMessage } = require("./sleekflow-message-normalizer");

function message(timestamp, isSentFromSleekflow, messageContent = "message", messageType = "text") {
  return { id: `m-${timestamp}`, timestamp, isSentFromSleekflow, messageContent, messageType };
}

test("normalization filters provider-only messages and preserves non-text ambiguity", () => {
  assert.equal(normalizeSleekFlowMessage(message(1, false, "<Unsupported Message Type>")).isUsable, false);
  assert.equal(normalizeSleekFlowMessage(message(1, false, "receipt", "receipt")).isUsable, false);
  const image = normalizeSleekFlowMessage(message(1, false, null, "image"));
  assert.equal(image.isUsable, true);
  assert.equal(image.text, null);
  assert.equal(image.direction, "CUSTOMER");
});

test("multiple consecutive usable messages form one conversation turn", () => {
  const turns = buildConversationTurns([
    normalizeSleekFlowMessage(message(1, false, "想問驗樓")),
    normalizeSleekFlowMessage(message(2, false, "收費")),
    normalizeSleekFlowMessage(message(3, true, "稍後回覆")),
    normalizeSleekFlowMessage(message(4, true, "請提供單位")),
  ]);
  assert.equal(turns.length, 2);
  assert.equal(turns[0].direction, "CUSTOMER");
  assert.equal(turns[0].messages.length, 2);
  assert.equal(turns[0].combinedText, "想問驗樓\n收費");
  assert.equal(turns[1].messages.length, 2);
});

test("customer request after CS reply is waiting for us", () => {
  const state = toOperationalMessageFields([message(1, true, "How can I help?"), message(2, false, "Please book inspection")]);
  assert.equal(state.status, "WAITING_US");
  assert.equal(state.followUpRequired, true);
  assert.equal(state.statusReasonCode, "CUSTOMER_REQUEST_AFTER_CS");
  assert.equal(state.lastMessageSender, "CUSTOMER");
  assert.equal(state.lastInboundAt.valueOf(), 2000);
  assert.equal(state.lastOutboundAt.valueOf(), 1000);
  assert.equal(state.messageCountUsedForStatus, 2);
});

test("latest CS turn is waiting for customer", () => {
  const state = toOperationalMessageFields([message(1, false, "想問驗樓收費"), message(2, true, "請提供單位資料")]);
  assert.equal(state.status, "WAITING_CUSTOMER");
  assert.equal(state.followUpRequired, false);
  assert.equal(state.lastMessageSender, "CS");
  assert.equal(state.statusReasonCode, "LATEST_TURN_CS");
});

test("acknowledgement-only customer turns resolve after a CS reply", () => {
  for (const acknowledgement of ["OK THX", "多謝", "明白😉謝謝你", "唔該晒", "👍"]) {
    const state = toOperationalMessageFields([message(1, true, "CS reply"), message(2, false, acknowledgement)]);
    assert.equal(state.status, "RESOLVED", acknowledgement);
    assert.equal(state.followUpRequired, false, acknowledgement);
    assert.equal(state.statusReasonCode, "CUSTOMER_TERMINAL_ACK", acknowledgement);
  }
});

test("acknowledgements with a new request remain waiting for CS", () => {
  for (const request of [
    "Thanks，另外想問驗樓幾錢？",
    "收到，幾時可以安排？",
    "想問驗樓收費",
    "好呀，可以加我入group嗎？",
    "明白，仲想問按揭點搞？",
    "唔該，想問律師轉介。",
  ]) {
    const state = toOperationalMessageFields([message(1, true, "CS reply"), message(2, false, request)]);
    assert.equal(state.status, "WAITING_US", request);
    assert.equal(state.followUpRequired, true, request);
  }
});

test("unsupported, system, non-text, and unknown-direction messages are unclear", () => {
  const cases = [
    [message(1, false, "<Unsupported Message Type>")],
    [message(1, false, "system", "system")],
    [message(1, false, null, "image")],
    [{ id: "unknown", timestamp: 1, messageContent: "hello", messageType: "text" }],
  ];
  const expectedReasons = ["NO_USABLE_MESSAGES", "NO_USABLE_MESSAGES", "NON_TEXT_CUSTOMER_TURN", "NO_USABLE_MESSAGES"];
  cases.forEach((messages, index) => {
    const state = toOperationalMessageFields(messages);
    assert.equal(state.status, "UNCLEAR");
    assert.equal(state.followUpRequired, false);
    assert.equal(state.statusReasonCode, expectedReasons[index]);
  });
});

test("ambiguous customer text does not default to waiting for CS", () => {
  const state = toOperationalMessageFields([message(1, false, "你好")]);
  assert.equal(state.status, "UNCLEAR");
  assert.equal(state.statusReasonCode, "AMBIGUOUS_CUSTOMER_TURN");
});

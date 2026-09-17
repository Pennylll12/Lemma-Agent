const test = require("node:test");
const assert = require("node:assert/strict");
const { toOperationalMessageFields } = require("./sleekflow-adapter");

function message(timestamp, isSentFromSleekflow, messageContent = "message") {
  return { timestamp, isSentFromSleekflow, messageContent };
}

test("inbound after outbound is waiting for CS", () => {
  const state = toOperationalMessageFields([message(1, true, "How can I help?"), message(2, false, "Please book inspection")]);
  assert.equal(state.status, "WAITING_US");
  assert.equal(state.followUpRequired, true);
  assert.equal(state.lastMessageSender, "CUSTOMER");
  assert.equal(state.lastInboundAt.valueOf(), 2000);
  assert.equal(state.lastOutboundAt.valueOf(), 1000);
});

test("outbound after inbound is waiting for customer", () => {
  const state = toOperationalMessageFields([message(1, false, "Need information"), message(2, true, "Please provide unit number")]);
  assert.equal(state.status, "WAITING_CUSTOMER");
  assert.equal(state.followUpRequired, false);
  assert.equal(state.lastMessageSender, "CS");
});

test("acknowledgement-only messages resolve after a CS reply", () => {
  for (const acknowledgement of ["OK THX", "收到，唔該晒🙏", "👍", "❤️"]) {
    const state = toOperationalMessageFields([message(1, true, "Your booking is confirmed"), message(2, false, acknowledgement)]);
    assert.equal(state.status, "RESOLVED", acknowledgement);
    assert.equal(state.followUpRequired, false, acknowledgement);
  }
});

test("acknowledgements with a new request remain waiting for CS", () => {
  for (const request of [
    "Thanks，另外想問驗樓幾錢？",
    "收到，幾時可以安排？",
    "好呀，另外可唔可以加入盛緻苑group？",
    "唔該，想再問按揭點申請？",
  ]) {
    const state = toOperationalMessageFields([message(1, true, "CS reply"), message(2, false, request)]);
    assert.equal(state.status, "WAITING_US", request);
    assert.equal(state.followUpRequired, true, request);
  }
});

test("customer question without a CS reply is waiting for CS", () => {
  const state = toOperationalMessageFields([message(1, false, "想問驗樓幾錢？")]);
  assert.equal(state.status, "WAITING_US");
  assert.equal(state.followUpRequired, true);
});

test("missing or unusable messages are unclear", () => {
  for (const messages of [[], [{ timestamp: 1 }]]) {
    const state = toOperationalMessageFields(messages);
    assert.equal(state.status, "UNCLEAR");
    assert.equal(state.followUpRequired, false);
    assert.equal(state.lastMessageSender, null);
  }
});

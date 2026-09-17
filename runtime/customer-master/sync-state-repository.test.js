const test = require("node:test");
const assert = require("node:assert/strict");
const { SLEEKFLOW_SYNC_STATE_ID, buildSyncCheckpoint } = require("./sync-state-repository");

test("sync checkpoint stores cursor and does not invent a timestamp", () => {
  const checkpoint = buildSyncCheckpoint({ cursor: "page-2", lastSyncAt: null });
  assert.equal(SLEEKFLOW_SYNC_STATE_ID, "sleekflow");
  assert.equal(checkpoint.cursor, "page-2");
  assert.equal(checkpoint.lastSyncAt, null);
  assert.equal(checkpoint.status, "success");
});

test("sync checkpoint rejects unknown states", () => {
  assert.throws(() => buildSyncCheckpoint({ status: "complete" }), RangeError);
});

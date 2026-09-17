const { FieldValue } = require("firebase-admin/firestore");

const SLEEKFLOW_SYNC_STATE_ID = "sleekflow";

function buildSyncCheckpoint({ cursor = null, lastSyncAt = null, status = "success" } = {}) {
  if (!new Set(["success", "failed", "running"]).has(status)) {
    throw new RangeError("invalid sync status");
  }

  return {
    cursor,
    lastSyncAt,
    status,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function saveSleekFlowCheckpoint(db, checkpoint) {
  await db
    .collection("syncState")
    .doc(SLEEKFLOW_SYNC_STATE_ID)
    .set(buildSyncCheckpoint(checkpoint), { merge: true });
}

module.exports = {
  SLEEKFLOW_SYNC_STATE_ID,
  buildSyncCheckpoint,
  saveSleekFlowCheckpoint,
};

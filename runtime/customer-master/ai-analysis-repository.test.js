const test = require("node:test");
const assert = require("node:assert/strict");
const { buildAiAnalysisDocument } = require("./ai-analysis-repository");

function analysis(overrides = {}) {
  return {
    analysisId: "analysis_test",
    conversationId: "conversation_test",
    customerId: "cust_test",
    primaryIntent: "INSPECTION_INQUIRY",
    summary: "Test summary",
    model: "future-model",
    analysisVersion: "v0.1",
    ...overrides,
  };
}

test("AI analysis foundation accepts the canonical v0.1 analysis shape without writing", () => {
  const document = buildAiAnalysisDocument(analysis({ confidence: 0.9 }));
  assert.equal(document.analysisId, "analysis_test");
  assert.deepEqual(document.secondaryIntents, []);
  assert.equal(document.detectedStage, null);
  assert.equal(document.confidence, 0.9);
  assert.ok(Object.hasOwn(document, "processedAt"));
});

test("AI analysis foundation validates required fields and confidence", () => {
  assert.throws(() => buildAiAnalysisDocument(analysis({ analysisId: "bad" })), TypeError);
  assert.throws(() => buildAiAnalysisDocument(analysis({ confidence: 1.1 })), RangeError);
});

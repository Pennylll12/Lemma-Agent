const { FieldValue } = require("firebase-admin/firestore");

function buildAiAnalysisDocument(input) {
  if (!input?.analysisId || !String(input.analysisId).startsWith("analysis_")) {
    throw new TypeError("analysisId must use the analysis_ prefix");
  }
  if (!input.conversationId) throw new TypeError("conversationId is required");
  if (!input.customerId) throw new TypeError("customerId is required");
  if (!input.primaryIntent) throw new TypeError("primaryIntent is required");
  if (!input.summary) throw new TypeError("summary is required");
  if (!input.model) throw new TypeError("model is required");
  if (!input.analysisVersion) throw new TypeError("analysisVersion is required");
  if (input.confidence !== undefined && input.confidence !== null && (typeof input.confidence !== "number" || input.confidence < 0 || input.confidence > 1)) {
    throw new RangeError("confidence must be a number from 0 to 1");
  }

  return {
    analysisId: input.analysisId,
    conversationId: input.conversationId,
    customerId: input.customerId,
    primaryIntent: input.primaryIntent,
    secondaryIntents: input.secondaryIntents || [],
    summary: input.summary,
    detectedStage: input.detectedStage ?? null,
    suggestedAction: input.suggestedAction ?? null,
    confidence: input.confidence ?? null,
    model: input.model,
    analysisVersion: input.analysisVersion,
    processedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = { buildAiAnalysisDocument };

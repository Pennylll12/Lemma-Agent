const { randomUUID } = require("node:crypto");
const { FieldValue } = require("firebase-admin/firestore");
const { normalizePhone, formatHongKongPhone } = require("./phone-normalizer");

const DEFAULT_INTERESTS = Object.freeze({
  inspection: false,
  renovation: false,
  mortgage: false,
  legal: false,
  appliance: false,
  group: false,
  paidConsultation: false,
});

function buildCustomerDefaults({ customerId, phoneNormalized, phoneDisplay, name }) {
  return {
    customerId,
    phoneNormalized,
    phoneDisplay: phoneDisplay || formatHongKongPhone(phoneNormalized),
    name: name || null,
    source: "SLEEKFLOW",
    scheme: null,
    estate: null,
    customerStage: "NEW",
    interests: { ...DEFAULT_INTERESTS },
    assignedCs: null,
    latestIntent: null,
    latestSummary: null,
    followUpRequired: false,
    priority: "P4",
    lastInboundAt: null,
    lastOutboundAt: null,
    lastConversationId: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function upsertCustomer(db, contact) {
  const phoneNormalized = normalizePhone(contact.phone);
  const customers = db.collection("customers");
  const lookup = customers.where("phoneNormalized", "==", phoneNormalized).limit(2);

  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(lookup);
    if (existing.size > 1) {
      throw new Error(`duplicate active customer masters for ${phoneNormalized}`);
    }

    if (existing.size === 1) {
      const customer = existing.docs[0];
      const update = { updatedAt: FieldValue.serverTimestamp() };
      if (contact.name) update.name = contact.name;
      if (contact.phoneDisplay) update.phoneDisplay = contact.phoneDisplay;
      transaction.set(customer.ref, update, { merge: true });
      return { customerId: customer.id, created: false };
    }

    const customerId = `cust_${randomUUID()}`;
    const ref = customers.doc(customerId);
    transaction.create(ref, buildCustomerDefaults({
      customerId,
      phoneNormalized,
      phoneDisplay: contact.phoneDisplay,
      name: contact.name,
    }));
    return { customerId, created: true };
  });
}

module.exports = { DEFAULT_INTERESTS, buildCustomerDefaults, upsertCustomer };

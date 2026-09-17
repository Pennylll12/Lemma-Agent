const test = require("node:test");
const assert = require("node:assert/strict");
const { DEFAULT_INTERESTS, buildCustomerDefaults } = require("./customer-repository");

test("new customer defaults are conservative and follow the v0.1 schema", () => {
  const customer = buildCustomerDefaults({
    customerId: "cust_test",
    phoneNormalized: "85291234567",
    name: "陳小姐",
  });

  assert.equal(customer.customerStage, "NEW");
  assert.equal(customer.source, "SLEEKFLOW");
  assert.equal(customer.scheme, null);
  assert.equal(customer.estate, null);
  assert.equal(customer.latestIntent, null);
  assert.equal(customer.priority, "P4");
  assert.deepEqual(customer.interests, DEFAULT_INTERESTS);
  assert.notEqual(customer.interests, DEFAULT_INTERESTS);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizePhone, formatHongKongPhone } = require("./phone-normalizer");

test("normalizes common Hong Kong WhatsApp phone formats", () => {
  assert.equal(normalizePhone("+852 9123 4567"), "85291234567");
  assert.equal(normalizePhone("852-9123-4567"), "85291234567");
  assert.equal(normalizePhone("91234567"), "85291234567");
  assert.equal(formatHongKongPhone("91234567"), "+852 9123 4567");
});

test("rejects missing or invalid numbers", () => {
  assert.throws(() => normalizePhone("123"), RangeError);
  assert.throws(() => normalizePhone(null), TypeError);
});

const DEFAULT_COUNTRY_CODE = "852";

function normalizePhone(input, { defaultCountryCode = DEFAULT_COUNTRY_CODE } = {}) {
  if (input === null || input === undefined) {
    throw new TypeError("phone number is required");
  }

  let digits = String(input).trim().replace(/[^0-9+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  digits = digits.replace(/\D/g, "");

  if (digits.length === 8 && defaultCountryCode) {
    digits = `${defaultCountryCode}${digits}`;
  }

  if (!/^\d{8,15}$/.test(digits)) {
    throw new RangeError("phone number must contain 8 to 15 digits");
  }

  return digits;
}

function formatHongKongPhone(phoneNormalized) {
  const digits = normalizePhone(phoneNormalized);
  if (!digits.startsWith(DEFAULT_COUNTRY_CODE) || digits.length !== 11) {
    return `+${digits}`;
  }
  return `+852 ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

module.exports = { DEFAULT_COUNTRY_CODE, normalizePhone, formatHongKongPhone };

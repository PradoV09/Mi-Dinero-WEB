export const CURRENCIES = [
  { value: "COP", label: "Peso colombiano (COP)", decimals: 0 },
  { value: "USD", label: "Dólar estadounidense (USD)", decimals: 2 },
  { value: "EUR", label: "Euro (EUR)", decimals: 2 },
] as const;

export type Currency = (typeof CURRENCIES)[number]["value"];

const AMOUNT_PATTERN = /^(-?)(\d+)(?:\.(\d+))?$/;
const DEFAULT_LOCALE = "es-CO";

export function isCurrency(value: string): value is Currency {
  return CURRENCIES.some((currency) => currency.value === value);
}

export function getCurrency(value: Currency) {
  return CURRENCIES.find((currency) => currency.value === value)!;
}

export function isValidAmount(value: string): boolean {
  return AMOUNT_PATTERN.test(value.trim());
}

function incrementDigits(value: string): string {
  const digits = value.split("");
  let carry = 1;

  for (let index = digits.length - 1; index >= 0 && carry === 1; index -= 1) {
    const nextDigit = Number(digits[index]) + carry;

    if (nextDigit === 10) {
      digits[index] = "0";
      carry = 1;
    } else {
      digits[index] = String(nextDigit);
      carry = 0;
    }
  }

  return carry === 1 ? `1${digits.join("")}` : digits.join("");
}

function roundToDecimals(
  integerPart: string,
  fractionPart: string,
  decimals: number,
): { integer: string; fraction: string } {
  const integer = integerPart.replace(/^0+(?=\d)/, "");

  if (fractionPart.length <= decimals) {
    return { integer, fraction: fractionPart.padEnd(decimals, "0") };
  }

  const keptFraction = fractionPart.slice(0, decimals);
  const nextDigit = fractionPart[decimals] ?? "0";

  if (nextDigit < "5") {
    return { integer, fraction: keptFraction };
  }

  const incremented = incrementDigits(`${integer}${keptFraction}`);

  if (decimals === 0) {
    return { integer: incremented, fraction: "" };
  }

  return {
    integer: incremented.slice(0, -decimals) || "0",
    fraction: incremented.slice(-decimals),
  };
}

export function formatMoney(
  amount: string,
  currency: Currency,
  locale = DEFAULT_LOCALE,
): string {
  const match = AMOUNT_PATTERN.exec(amount.trim());

  if (!match) {
    return "—";
  }

  const [, sign, integerPart, fractionPart = ""] = match;
  const { decimals } = getCurrency(currency);
  const rounded = roundToDecimals(integerPart, fractionPart, decimals);

  const integerFormatter = new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits: 0,
  });

  const currencyParts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).formatToParts(0);

  const integerIndex = currencyParts.findIndex(
    (part) => part.type === "integer",
  );
  const decimalSymbol =
    currencyParts.find((part) => part.type === "decimal")?.value ?? ".";
  const prefix = currencyParts
    .slice(0, integerIndex)
    .map((part) => part.value)
    .join("");
  const suffix = currencyParts
    .slice(integerIndex + 1)
    .filter((part) => part.type !== "decimal" && part.type !== "fraction")
    .map((part) => part.value)
    .join("");

  const formattedInteger = integerFormatter.format(BigInt(rounded.integer));
  const formattedFraction =
    decimals > 0 ? `${decimalSymbol}${rounded.fraction}` : "";

  return `${sign}${prefix}${formattedInteger}${formattedFraction}${suffix}`;
}

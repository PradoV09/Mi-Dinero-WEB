const DEFAULT_LOCALE = "es-CO";
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
export const BOGOTA_TIME_ZONE = "America/Bogota";

export function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

function toDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (DATE_ONLY_PATTERN.test(value)) {
    return parseDateOnly(value);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: string | Date,
  locale = DEFAULT_LOCALE,
): string {
  const date = toDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export function formatDateTime(
  value: string | Date,
  locale = DEFAULT_LOCALE,
): string {
  const date = toDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function todayInBogota(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOGOTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return toDateInputValue(date);
  }

  return `${year}-${month}-${day}`;
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

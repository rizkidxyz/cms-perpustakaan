const longDateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" });
const mediumDateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export function formatDateLong(value) {
  return longDateFormatter.format(value);
}

export function formatDateMedium(value) {
  return mediumDateFormatter.format(value);
}

export function toDateAttribute(value) {
  return new Date(value).toISOString();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeTransportArray(value, depth) {
  return value
    .map((entry) => sanitizeTransportValue(entry, depth + 1))
    .filter((entry) => entry !== undefined);
}

function sanitizeTransportObjectEntries(value, depth) {
  const entries = Object.entries(value)
    .map(([key, entryValue]) => [key, sanitizeTransportValue(entryValue, depth + 1)])
    .filter(([, entryValue]) => entryValue !== undefined);

  return entries.length ? Object.fromEntries(entries) : {};
}

export function sanitizeTransportValue(value, depth = 0) {
  if (depth > 8) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    return sanitizeTransportArray(value, depth);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isPlainObject(value)) {
    return sanitizeTransportObjectEntries(value, depth);
  }

  return undefined;
}

export function sanitizeTransportObject(value, fallback = {}) {
  const sanitized = sanitizeTransportValue(value);
  return isPlainObject(sanitized) ? sanitized : fallback;
}

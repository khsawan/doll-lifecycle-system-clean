function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function resolveApplicationContext(context, defaults = {}) {
  const resolved = { ...defaults };

  if (!isPlainObject(context)) {
    return resolved;
  }

  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined) {
      resolved[key] = value;
    }
  }

  return resolved;
}


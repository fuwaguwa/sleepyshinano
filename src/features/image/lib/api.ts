const SRA_BASE = "https://api.some-random-api.com/";

/**
 * Build a SomeRandomAPI URL with query parameters.
 */
export function buildSraUrl(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}) {
  const url = new URL(endpoint, SRA_BASE);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

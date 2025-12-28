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

/**
 * Fetch JSON from an API with error handling
 */
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return (await response.json()) as Promise<T>;
}

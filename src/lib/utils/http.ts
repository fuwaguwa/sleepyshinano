import { client } from "../../index";

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
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  const response = await fetch(url, options);
  if (!response.ok) {
    client.logger.error(response.status);
    client.logger.error(response.statusText);
    return null;
  }
  return (await response.json()) as T;
}

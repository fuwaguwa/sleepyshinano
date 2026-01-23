import { container } from "@sapphire/framework";

/**
 * Fetch JSON from an API with error handling
 */
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  const response = await fetch(url, options);
  if (!response.ok) {
    container.logger.error(response.status);
    container.logger.error(response.statusText);
    return null;
  }
  return (await response.json()) as T;
}

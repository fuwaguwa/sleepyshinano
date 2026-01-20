import { container } from "@sapphire/framework";
import { KemonoCreator } from "../structures/Kemono";
import type { KemonoAPIResponseError, KemonoAPIResponseOK } from "../typings/kemono";
import { KEMONO_API2_BASE_URL, KEMONO_SERVICES } from "./constants";

export async function kemonoSearchCreator(creator: string): Promise<KemonoCreator[] | null> {
  try {
    const response = await fetch(`${KEMONO_API2_BASE_URL}/search/${creator}`);

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const result = (await response.json()) as KemonoAPIResponseOK | KemonoAPIResponseError;

    if (result.message !== "OK") throw new Error(`API error! Message: ${result.message}`);

    const resultData = (result as KemonoAPIResponseOK).data;

    if (!resultData || resultData.length === 0) throw new Error(`No creators found for query: ${creator}`);

    const creators = resultData
      .filter(apiCreator => KEMONO_SERVICES.includes(apiCreator.service))
      .sort((a, b) => b.favorited - a.favorited)
      .slice(0, 10)
      .map(apiCreator => new KemonoCreator(apiCreator));

    return creators;
  } catch (error) {
    container.logger.error(`Kemono(Creator): ${(error as Error).message}`);

    return null;
  }
}

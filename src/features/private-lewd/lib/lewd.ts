import { randomItem } from "../../../shared/lib/utils";
import { LewdModel } from "../models/Lewd";
import type { FetchLewdOptions, LewdCategory, LewdResult } from "../types/Lewd";

/**
 * Fetch random lewd media from database
 */
export async function fetchRandomLewd({ category, isPremium, format, limit = 1 }: FetchLewdOptions = {}) {
  return LewdModel.aggregate<LewdResult>([
    {
      $match: {
        ...(category && { category }),
        ...(isPremium && { premium: true }),
        ...(format && { format }),
      },
    },
    { $sample: { size: limit } },
    {
      $project: {
        category: 1,
        link: 1,
        format: 1,
        _id: 0,
      },
    },
  ]);
}

export function getRandomLewdCategory(): LewdCategory {
  return randomItem<LewdCategory>(["hoyo", "kemonomimi", "misc", "shipgirls", "undies"]);
}

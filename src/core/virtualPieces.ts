// shared/lib/virtualPieces.ts

import type { StoreManagerManuallyRegisteredPiece, StoreRegistryEntries } from "@sapphire/framework";
import { container } from "@sapphire/framework";

export function loadPieces<K extends keyof StoreRegistryEntries>(
  store: K,
  pieces: Array<Omit<StoreManagerManuallyRegisteredPiece<K>, "store">>
) {
  for (const piece of pieces) {
    void container.stores.loadPiece<K>({ ...piece, store });
  }
}

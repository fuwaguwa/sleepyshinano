import type { StoreRegistryEntries } from "@sapphire/framework";
import { container } from "@sapphire/framework";
import type { Store } from "@sapphire/pieces";

type PieceConstructor<K extends keyof StoreRegistryEntries> =
  StoreRegistryEntries[K] extends Store<infer P> ? new (...args: any[]) => P : never;

export async function autoDiscoverPieces<K extends keyof StoreRegistryEntries>(
  store: K,
  globPattern: string,
  baseDir: string // Pass the base directory explicitly
) {
  console.log(`AutoDiscover: Scanning for ${store} in pattern: ${globPattern}`);
  console.log(`AutoDiscover: Base directory: ${baseDir}`);

  const glob = new Bun.Glob(globPattern);
  let found = 0;

  for await (const file of glob.scan({ cwd: baseDir })) {
    console.log(`AutoDiscover: Found file: ${file}`);
    try {
      const module = await import(`${baseDir}/${file}`);
      const exportedClass = Object.values(module).find(exp => typeof exp === "function" && exp.prototype);

      if (exportedClass && typeof exportedClass === "function") {
        const name =
          file
            .split("/")
            .pop()
            ?.replace(/\.(ts|js)$/, "") || "unknown";
        console.log(`AutoDiscover: Loading ${store}: ${name}`);
        void container.stores.loadPiece<K>({
          piece: exportedClass as unknown as PieceConstructor<K>,
          name,
          store,
        });
        found++;
      }
    } catch (error) {
      console.error(`AutoDiscover: Error loading ${file}:`, error);
    }
  }

  console.log(`AutoDiscover: Loaded ${found} ${store}\n`);
}

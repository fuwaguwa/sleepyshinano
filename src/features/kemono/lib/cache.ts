import type { PostListItem } from "../types/Kemono";
import type { KemonoPost } from "./kemono";

export const kemonoPostsCache: Map<string, PostListItem[]> = new Map();
export const kemonoPostContentCache: Map<string, KemonoPost> = new Map();

export function setKemonoPostsCache(creatorId: string, posts: PostListItem[]) {
  kemonoPostsCache.set(creatorId, posts);

  setTimeout(
    () => {
      kemonoPostsCache.delete(creatorId);
    },
    10 * 60 * 1000
  );
}

export function setKemonoPostContentCache(postId: string, creatorId: string, post: KemonoPost) {
  const cacheKey = `${creatorId}-${postId}`;

  kemonoPostContentCache.set(cacheKey, post);
  setTimeout(
    () => {
      kemonoPostContentCache.delete(cacheKey);
    },
    12 * 60 * 60 * 1000
  );
}

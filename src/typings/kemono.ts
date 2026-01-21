import type { KEMONO_SERVICES } from "../lib/constants";

export type KemonoService = (typeof KEMONO_SERVICES)[number];

export interface KemonoAPICreator {
  id: string;
  favorited: number;
  indexed: number;
  name: string;
  service: KemonoService;
  updated: number;
  [key: string]: string | number;
}

// File references (images, videos, attachments)
interface FileReference {
  name: string;
  path: string;
}

// Preview thumbnails
interface Preview {
  type: string;
  server: string;
  name: string;
  path: string;
}

// Base post structure (shared fields)
interface BasePost {
  id: string;
  user: string;
  service: string;
  title: string;
  published: string; // ISO timestamp
  file: FileReference | Record<string, never>; // Can be empty object
  attachments: FileReference[];
}

// Post in list view (from /posts endpoint)
export interface PostListItem extends BasePost {
  substring: string; // Truncated content preview
}

// Full post details (from /post/{id} endpoint)
interface Post extends BasePost {
  content: string;
  embed: Record<string, unknown>;
  shared_file: boolean;
  added: string; // ISO timestamp
  edited: string; // ISO timestamp
  poll: null | unknown;
  captions: null | unknown;
  tags: string[] | null;
  incomplete_rewards?: null | unknown; // Optional field
  next: string | null;
  prev: string | null;
}

interface PostRevision extends Post {
  revision_id?: number; // Only exists in some revisions
}

// Props wrapper for full post response
interface Props {
  flagged: null | unknown;
  revisions: [number, PostRevision][]; // Tuple: [revision_number, post_data]
}

// Full single post response (from /post/{id})
export interface PostDetailResponse {
  post: Post;
  attachments: unknown[];
  previews: Preview[];
  videos: unknown[];
  props: Props;
}

// Posts list response (from /posts endpoint)
export type PostsListResponse = PostListItem[];

export interface KemonoPostAttachment {
  name: string;
  url: string;
}

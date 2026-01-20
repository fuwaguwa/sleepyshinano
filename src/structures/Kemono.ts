import { container } from "@sapphire/framework";
import { KEMONO_API_BASE_URL, KEMONO_BASE_URL } from "../lib/constants";
import type {
  KemonoAPICreator,
  KemonoService,
  PostDetailResponse,
  PostListItem,
  PostsListResponse,
} from "../typings/kemono";

export class KemonoCreator {
  public readonly id: string;
  public readonly name: string;
  public readonly service: KemonoService;
  public readonly favorited: number;
  public readonly url: string;
  public readonly apiBaseUrl: string;
  public readonly avatar: string;

  constructor(data: KemonoAPICreator) {
    this.id = data.id;
    this.name = data.name;
    this.service = data.service;
    this.favorited = data.favorited;

    this.url = `${KEMONO_BASE_URL}/${this.service}/user/${this.id}`;
    this.apiBaseUrl = `${KEMONO_API_BASE_URL}/v1/${this.service}/user/${this.id}`;
    this.avatar = `${KEMONO_BASE_URL}/icons/${this.service}/${this.id}`;
  }

  public async getPosts(): Promise<PostListItem[] | null> {
    try {
      const allPosts: PostListItem[] = [];
      let offset = 0;
      while (true) {
        const params = new URLSearchParams({
          o: offset.toString(),
        });
        const headers: Bun.HeadersInit = {
          Accept: "text/css",
        };
        const response = await fetch(`${this.apiBaseUrl}/posts?${params.toString()}`, { headers });
        const posts = (await response.json()) as PostsListResponse;
        if (posts.length === 0) break;
        allPosts.push(...posts);
        if (posts.length < 50) break; // last page
        offset += 50;
      }
      return allPosts;
    } catch (error) {
      container.logger.error(`Kemono(Posts): ${(error as Error).message}`);
      return null;
    }
  }

  public async getPost(postId: string): Promise<KemonoPost | null> {
    try {
      const headers: Bun.HeadersInit = {
        Accept: "text/css",
      };
      const response = await fetch(`${this.apiBaseUrl}/post/${postId}`, { headers });
      const result = (await response.json()) as PostDetailResponse;
      const post = result.post;

      const strippedContent = post.content.replace(/<[^>]*>/g, "").trim();
      const previewUrl =
        post.file && "path" in post.file && post.file.path ? `${KEMONO_BASE_URL}/data${post.file.path}` : null;
      const attachments = post.attachments.map(attachment => `${KEMONO_BASE_URL}/data${attachment.path}`);

      return new KemonoPost(
        post.id,
        post.user,
        post.service as KemonoService,
        post.title,
        strippedContent,
        new Date(post.published),
        previewUrl,
        attachments
      );
    } catch (error) {
      container.logger.error(`Kemono(Post): ${(error as Error).message}`);
      return null;
    }
  }
}

export class KemonoPost {
  public readonly id: string;
  public readonly user: string;
  public readonly service: KemonoService;
  public readonly title: string;
  public readonly content: string;
  public readonly date: string;
  public readonly previewUrl: string | null;
  public readonly attachments: string[];

  constructor(
    id: string,
    user: string,
    service: KemonoService,
    title: string,
    content: string,
    date: Date,
    previewUrl: string | null,
    attachments: string[]
  ) {
    this.id = id;
    this.user = user;
    this.service = service;
    this.title = title;
    this.content = content;
    this.date = Math.floor(new Date(date).getTime() / 1000).toString(); // unix timestamp (seconds)
    this.previewUrl = previewUrl;
    this.attachments = attachments;
  }
}

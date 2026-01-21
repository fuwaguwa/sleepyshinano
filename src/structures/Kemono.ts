import { container } from "@sapphire/framework";
import Fuse from "fuse.js";
import { KEMONO_API_BASE_URL, KEMONO_BASE_URL } from "../lib/constants";
import type {
  KemonoAPICreator,
  KemonoPostAttachment,
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

  public readonly updated: number;
  public readonly indexed: number;

  constructor(data: KemonoAPICreator) {
    this.id = data.id;
    this.name = data.name;
    this.service = data.service;
    this.favorited = data.favorited;
    this.indexed = data.indexed;
    this.updated = data.updated;

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
        const response = await fetch(`${this.apiBaseUrl}/posts?${params.toString()}`, {
          headers: { Accept: "text/css" },
        });
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
      const response = await fetch(`${this.apiBaseUrl}/post/${postId}`, { headers: { Accept: "text/css" } });
      const result = (await response.json()) as PostDetailResponse;
      const post = result.post;

      const strippedContent = post.content.replace(/<[^>]*>/g, "").trim();
      const previewUrl =
        post.file && "path" in post.file && post.file.path ? `${KEMONO_BASE_URL}/data${post.file.path}` : null;
      const attachments = post.attachments.map(attachment => {
        return {
          name: attachment.name,
          url: `${KEMONO_BASE_URL}/data${attachment.path}`,
        };
      });

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
  public readonly attachments: KemonoPostAttachment[];

  constructor(
    id: string,
    user: string,
    service: KemonoService,
    title: string,
    content: string,
    date: Date,
    previewUrl: string | null,
    attachments: KemonoPostAttachment[]
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

export class Kemono {
  private creators: KemonoAPICreator[] = [];
  private fuse: Fuse<KemonoAPICreator>;

  constructor() {
    // Initialize empty Fuse instance (will be populated in load())
    this.fuse = new Fuse([], {
      keys: ["name", "id"],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }

  public async start() {
    container.logger.info("Kemono: Initializing...");
    const intervalTime = 12 * 60 * 60 * 1000;
    await this.load();
    setInterval(async () => {
      await this.load();
    }, intervalTime);
  }

  private async load() {
    const response = await fetch("https://kemono.cr/api/v1/creators", {
      headers: { Accept: "text/css" },
    });
    this.creators = (await response.json()) as KemonoAPICreator[];

    container.logger.info("Kemono: Building search index...");
    this.fuse = new Fuse(this.creators, {
      keys: ["name", "id"],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });

    container.logger.info(`Kemono: Loaded ${this.creators.length} creators`);
  }

  public async searchAPICreator(query: string, limit: number, id?: string | null): Promise<KemonoAPICreator[] | null> {
    try {
      let results: KemonoAPICreator[];

      if (id) {
        const searchResults = this.fuse.search(id);
        results = searchResults.map(r => r.item);
      } else {
        const searchResults = this.fuse.search(query);
        results = searchResults.map(r => r.item);
      }

      const creators = results.sort((a, b) => (b.favorited || 0) - (a.favorited || 0)).slice(0, limit);

      return creators;
    } catch (error) {
      container.logger.error(`Kemono(Creator): ${(error as Error).message}`);
      return null;
    }
  }

  public async searchCreator(query: string, id?: string | null): Promise<KemonoCreator[] | null> {
    try {
      const apiCreators = await this.searchAPICreator(query, 100, id);
      if (apiCreators) return apiCreators.map(apiCreator => new KemonoCreator(apiCreator));
    } catch (error) {
      container.logger.error(`Kemono(Creator): ${(error as Error).message}`);
    }
    return null;
  }

  public getCreatorById(id: string): KemonoCreator | null {
    try {
      const creator = this.creators.find(c => c.id === id);
      return creator ? new KemonoCreator(creator) : null;
    } catch (error) {
      console.error(`Kemono(Creator): ${(error as Error).message}`);
      return null;
    }
  }

  public async slowJsonSearch(query: string, limit: number, id?: string): Promise<KemonoCreator[] | null> {
    let results: KemonoAPICreator[];
    if (id) {
      results = this.creators.filter(c => c.id.toLowerCase().includes(id.toLowerCase()));
    } else {
      const lowerQuery = query.toLowerCase();
      results = this.creators.filter(c => c.name.toLowerCase().includes(lowerQuery));
    }
    return results
      .sort((a, b) => (b.favorited || 0) - (a.favorited || 0))
      .slice(0, limit)
      .map(apiCreator => new KemonoCreator(apiCreator));
  }
}

import { container } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  type Guild,
  MediaGalleryBuilder,
  MessageFlags,
  SeparatorBuilder,
  type TextChannel,
  TextDisplayBuilder,
} from "discord.js";
import { IMMUNE_IDS, SHINANO_CONFIG, TOPGG_EMOJI_ID, TOPGG_VOTE_URL } from "../../../shared/constants";
import { getCurrentTimestamp } from "../../../shared/lib/utils";
import { BOORU_CONFIG } from "../../booru/constants";
import { createLinkButtons, queryBooru } from "../../booru/lib/booru";
import { isVideoUrl } from "../../booru/lib/utils";
import type { BooruSite } from "../../booru/types/API";
import { checkVote } from "../../vote/lib/voteCheck";
import { AUTOBOORU_POSTING_INTERVAL } from "../constants";
import { AutobooruModel } from "../models/Autobooru";

export class ShinanoAutobooru {
  public async startBooruPosting() {
    container.logger.info("Autobooru: Initializing...");

    const isDevelopment = SHINANO_CONFIG.nodeEnv === "development";
    const intervalTime = isDevelopment ? 10000 : AUTOBOORU_POSTING_INTERVAL;

    await this.processAutobooru(isDevelopment, intervalTime);
    setInterval(async () => {
      await this.processAutobooru(isDevelopment, intervalTime);
    }, intervalTime);
  }

  private async sendBooruToChannel(
    channel: TextChannel,
    userId: string,
    tags: string,
    isRandom: boolean,
    site: BooruSite
  ): Promise<boolean> {
    try {
      const config = BOORU_CONFIG[site];
      const query = await queryBooru(site, tags, userId, isRandom);
      const post = query.post;

      if (!post) {
        container.logger.error(`No booru post found! Guild: ${channel.guild.id}`);
        return false;
      }

      const fileUrl = post.file_url;
      const isVideo = isVideoUrl(fileUrl);
      const tagMessage = `**Requested Tag(s)**: ${tags
        .split(" ")
        .map(tag => `\`${tag}\``)
        .join(", ")}`;

      const postUrl = config.baseUrl + post.id;
      const links = createLinkButtons(postUrl, post.source, isVideo);

      const descriptionText = new TextDisplayBuilder().setContent(tagMessage);
      const gallery = new MediaGalleryBuilder().addItems([{ media: { url: post.file_url } }]);
      const footer = new TextDisplayBuilder().setContent(`-# <t:${getCurrentTimestamp()}:R>`);
      const separator = new SeparatorBuilder();
      const containerComponent = new ContainerBuilder()
        .addTextDisplayComponents(descriptionText)
        .addMediaGalleryComponents(gallery)
        .addTextDisplayComponents(footer)
        .addSeparatorComponents(separator)
        .addActionRowComponents(links);

      await channel.send({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });

      return true;
    } catch (error) {
      container.logger.error("Error sending booru to channel:", error);
      return false;
    }
  }

  private async processDevelopmentMode() {
    const testGuildId = "1002188153685295204";
    const testChannelId = "1456564611301118083";

    try {
      const guild = await container.client.guilds.fetch(testGuildId);
      const channel = await guild.channels.fetch(testChannelId);

      await this.sendBooruToChannel(channel as TextChannel, "836215956346634270", "genshin_impact", false, "rule34");
    } catch (error) {
      container.logger.error("Error in dev autobooru:", error);
    }
  }

  private async processAutobooru(isDevelopment: boolean, intervalTime: number) {
    try {
      if (isDevelopment) return this.processDevelopmentMode();

      const now = getCurrentTimestamp() * 1000;

      const autoboorus = await AutobooruModel.find({
        $or: [{ lastPostTime: null }, { lastPostTime: { $lte: now - intervalTime } }], // less than or equal to
      });

      container.logger.info(`Autobooru: Processing ${autoboorus.length} servers due for posting`);

      for (const autobooru of autoboorus) {
        try {
          let guild: Guild;
          try {
            guild = await container.client.guilds.fetch(autobooru.guildId);
          } catch (_) {
            container.logger.info(`Autobooru: Guild ${autobooru.guildId} not found, deleting entry...`);
            await autobooru.deleteOne();
            continue;
          }

          // Check if channel exists
          let channel: TextChannel;
          try {
            channel = (await guild.channels.fetch(autobooru.channelId)) as TextChannel;
          } catch (_) {
            container.logger.info(
              `Autobooru: Channel ${autobooru.channelId} is not text-based, deleting entry of ${autobooru.guildId}...`
            );
            await autobooru.deleteOne();
            continue;
          }

          // Check if channel is NSFW
          if (!channel?.nsfw) {
            const nsfwMessage = new TextDisplayBuilder().setContent("### 🔞 NSFW Feature");
            const nsfwInfo = new TextDisplayBuilder().setContent(
              "This channel is NOT NSFW, please make this channel age-restricted, and run `/autobooru` again!"
            );
            const separator = new SeparatorBuilder();
            const nsfwContainer = new ContainerBuilder()
              .addTextDisplayComponents(nsfwMessage)
              .addSeparatorComponents(separator)
              .addTextDisplayComponents(nsfwInfo);

            await channel.send({ flags: MessageFlags.IsComponentsV2, components: [nsfwContainer] });

            await autobooru.deleteOne();
            container.logger.info(
              `Autobooru: Channel ${autobooru.channelId} is not NSFW, deleting entry of ${autobooru.guildId}`
            );
            continue;
          }

          // Check vote status
          const isLowkACoolGuy = IMMUNE_IDS.includes(autobooru.userId);
          const validVote = await checkVote(autobooru.userId);

          if (!isLowkACoolGuy && !validVote && !autobooru.sentNotVotedWarning) {
            const voteMessage = new TextDisplayBuilder().setContent("### ❌️ Vote Expired");
            const voteInfo = new TextDisplayBuilder().setContent("Please vote for Shinano to continue posting!");
            const separator = new SeparatorBuilder();
            const links = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Vote on top.gg")
                .setEmoji({ id: TOPGG_EMOJI_ID })
                .setURL(TOPGG_VOTE_URL),
              new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Check top.gg Vote")
                .setEmoji({ name: "🔍" })
                .setCustomId("voteCheck")
            );

            const voteContainer = new ContainerBuilder()
              .addTextDisplayComponents(voteMessage)
              .addSeparatorComponents(separator)
              .addTextDisplayComponents(voteInfo)
              .addSeparatorComponents(separator)
              .addActionRowComponents(links);

            await channel.send({
              flags: MessageFlags.IsComponentsV2,
              content: `<@${autobooru.userId}>,`,
              components: [voteContainer],
            });

            autobooru.sentNotVotedWarning = true;
            await autobooru.save();
            continue;
          } else if (autobooru.sentNotVotedWarning && validVote) {
            autobooru.sentNotVotedWarning = false;
            await autobooru.save();
          }

          const tags = autobooru.tags;
          const isRandom = autobooru.isRandom;
          const success = await this.sendBooruToChannel(channel, autobooru.userId, tags, isRandom, autobooru.site);

          if (success) {
            const jitter = Math.random() * AUTOBOORU_POSTING_INTERVAL;
            autobooru.lastPostTime = now - jitter;
            await autobooru.save();

            container.logger.info(
              `Autobooru: Sent post to guild ${autobooru.guildId} in channel ${autobooru.channelId}`
            );
          } else throw new Error();
        } catch (error) {
          container.logger.error(`Error processing autobooru for ${autobooru.guildId}:`, error);
        }
      }
    } catch (error) {
      container.logger.error("Autobooru processing error:", error);
    }
  }
}

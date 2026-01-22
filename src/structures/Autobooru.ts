import { container } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  EmbedBuilder,
  type Guild,
  MediaGalleryBuilder,
  MessageFlags,
  SeparatorBuilder,
  type TextChannel,
  TextDisplayBuilder,
} from "discord.js";
import { createLinkButtons, queryBooru } from "../lib/booru";
import { BOORU_CONFIG, TOPGG_EMOJI_ID, TOPGG_VOTE_URL } from "../lib/constants";
import { getCurrentTimestamp, isVideoUrl } from "../lib/utils/misc";
import { AutobooruModel } from "../models/Autobooru";
import { UserModel } from "../models/User";
import type { BooruSite } from "../typings/api/booru";

export class ShinanoAutobooru {
  public async startBooruPosting() {
    container.logger.info("Autobooru: Initializing...");

    const isDevelopment = process.env.NODE_ENV === "development";
    const intervalTime = isDevelopment ? 10000 : 60000;

    await this.processAutobooru(isDevelopment);
    setInterval(async () => {
      await this.processAutobooru(isDevelopment);
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

      // container.logger.debug(fileUrl);

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

  private async processAutobooru(isDevelopment: boolean) {
    try {
      if (isDevelopment) return this.processDevelopmentMode();

      const autoboorus = await AutobooruModel.find();

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
            const errorEmbed = new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                "❌ This channel is NOT NSFW, please make this channel age-restricted and run `/autobooru` again"
              );

            await channel.send({ embeds: [errorEmbed] });
            await autobooru.deleteOne();
            container.logger.info(
              `Autobooru: Channel ${autobooru.channelId} is not NSFW, deleting entry of ${autobooru.guildId}`
            );
            continue;
          }

          // Check vote status
          const user = await UserModel.findOne({ userId: autobooru.userId });
          const currentTimestamp = getCurrentTimestamp();
          const isLowkACoolGuy = process.env.COOL_PEOPLE_IDS.split(",").includes(autobooru.userId);
          const validVote = user?.voteExpiredTimestamp && user.voteExpiredTimestamp >= currentTimestamp;

          if (!isLowkACoolGuy && !validVote && !autobooru.sentNotVotedWarning) {
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

            const voteBro = new EmbedBuilder()
              .setColor("Red")
              .setTitle("Vote expired!")
              .setDescription("❌ Please vote for Shinano to continue posting!");

            await channel.send({
              content: `<@${autobooru.userId}>,`,
              embeds: [voteBro],
              components: [links],
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
            container.logger.info(
              `Autobooru: Sent post to guild ${autobooru.guildId} in channel ${autobooru.channelId}`
            );
          } else {
            throw new Error();
          }
        } catch (_) {
          container.logger.error(`Error processing autobooru for ${autobooru.guildId}`);
        }
      }
    } catch (error) {
      container.logger.error("Autobooru processing error:", error);
    }
  }
}

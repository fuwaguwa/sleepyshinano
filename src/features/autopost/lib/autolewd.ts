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
import { IMMUNE_IDS, MAIN_GUILD_ID, SHINANO_CONFIG, TOPGG_EMOJI_ID, TOPGG_VOTE_URL } from "../../../shared/constants";
import { getCurrentTimestamp } from "../../../shared/lib/utils";
import { fetchRandomLewd, getRandomLewdCategory } from "../../private-lewd/lib/lewd";
import type { LewdCategory, LewdMedia } from "../../private-lewd/types/Lewd";
import { UserVoteModel } from "../../vote/models/UserVote";
import { AUTOLEWD_POSTING_INTERVAL } from "../constants";
import { AutolewdModel } from "../models/Autolewd";

export class ShinanoAutolewd {
  public async startLewdPosting() {
    container.logger.info("Autolewd: Initializing");

    const isDevelopment = SHINANO_CONFIG.nodeEnv === "development";
    const intervalTime = isDevelopment ? 10000 : AUTOLEWD_POSTING_INTERVAL;

    await this.processAutolewd(isDevelopment, intervalTime);
    setInterval(async () => {
      await this.processAutolewd(isDevelopment, intervalTime);
    }, intervalTime);
  }

  private async sendLewdToChannel(channel: TextChannel, category: LewdCategory | null): Promise<boolean> {
    try {
      const results = await fetchRandomLewd({ category });

      if (results.length === 0) {
        container.logger.error("No lewd found!");
        return false;
      }

      const media = results[0] as LewdMedia;

      const gallery = new MediaGalleryBuilder().addItems([{ media: { url: media.link } }]);
      const footer = new TextDisplayBuilder().setContent(
        `-# Category: ${media.category} | <t:${getCurrentTimestamp()}:R>`
      );
      const containerComponent = new ContainerBuilder()
        .addMediaGalleryComponents(gallery)
        .addTextDisplayComponents(footer);

      await channel.send({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
      return true;
    } catch (error) {
      container.logger.error("Error sending lewd to channel:", error);
      return false;
    }
  }

  private async processDevelopmentMode() {
    const testGuildId = "1002188153685295204";
    const testChannelId = "1455798633936191529";

    try {
      const guild = await container.client.guilds.fetch(testGuildId);
      const channel = await guild.channels.fetch(testChannelId);

      await this.sendLewdToChannel(channel as TextChannel, null);
    } catch (error) {
      container.logger.error("Error in dev autolewd:", error);
    }
  }

  private async processAutolewd(isDevelopment: boolean, intervalTime: number) {
    try {
      if (isDevelopment) return this.processDevelopmentMode();

      const now = Date.now();

      const autolewds = await AutolewdModel.find({
        $or: [{ lastPostTime: null }, { lastPostTime: { $lte: now - intervalTime } }],
      });

      container.logger.info(`Autolewd: Processing ${autolewds.length} servers due for posting`);

      const mainGuild = await container.client.guilds.fetch(MAIN_GUILD_ID);

      for (const autolewd of autolewds) {
        try {
          // Check if guild exists
          let guild: Guild;
          try {
            guild = await container.client.guilds.fetch(autolewd.guildId);
          } catch (_) {
            container.logger.info(`Autolewd: Guild ${autolewd.guildId} not found, deleting entry...`);
            await autolewd.deleteOne();
            continue;
          }

          // Check if channel exists
          let channel: TextChannel;
          try {
            channel = (await guild.channels.fetch(autolewd.channelId)) as TextChannel;
          } catch (_) {
            container.logger.info(
              `Autolewd: Channel ${autolewd.channelId} is not text-based, deleting entry of ${autolewd.guildId}...`
            );
            await autolewd.deleteOne();
            continue;
          }

          // Check if channel is NSFW
          if (!channel?.nsfw) {
            const nsfwMessage = new TextDisplayBuilder().setContent("### 🔞 NSFW Feature");
            const nsfwInfo = new TextDisplayBuilder().setContent(
              "This channel is NOT NSFW, please make this channel age-restricted, and run `/autolewd` again!"
            );
            const separator = new SeparatorBuilder();
            const nsfwContainer = new ContainerBuilder()
              .addTextDisplayComponents(nsfwMessage)
              .addSeparatorComponents(separator)
              .addTextDisplayComponents(nsfwInfo);

            await channel.send({ flags: MessageFlags.IsComponentsV2, components: [nsfwContainer] });

            await autolewd.deleteOne();
            container.logger.info(
              `Autolewd: Channel ${autolewd.channelId} is not NSFW, deleting entry of ${autolewd.guildId}`
            );
            continue;
          }

          // Check if user is in main server
          try {
            await mainGuild.members.fetch(autolewd.userId);
          } catch (_) {
            container.logger.info(
              `Autolewd: User ${autolewd.userId} is not in main server, deleting entry of ${autolewd.guildId}`
            );
            await autolewd.deleteOne();
            continue;
          }

          // Check vote status
          const user = await UserVoteModel.findOne({ userId: autolewd.userId });
          const currentTimestamp = getCurrentTimestamp();
          const isLowkACoolGuy = IMMUNE_IDS.includes(autolewd.userId);
          const validVote = user?.voteExpiredTimestamp && user.voteExpiredTimestamp >= currentTimestamp;

          if (!isLowkACoolGuy && !validVote && !autolewd.sentNotVotedWarning) {
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
              content: `<@${autolewd.userId}>,`,
              components: [voteContainer],
            });

            autolewd.sentNotVotedWarning = true;
            await autolewd.save();
            continue;
          } else if (autolewd.sentNotVotedWarning && validVote) {
            autolewd.sentNotVotedWarning = false;
            await autolewd.save();
          }

          const category: LewdCategory =
            autolewd.category === "random" ? getRandomLewdCategory() : (autolewd.category as LewdCategory);
          const success = await this.sendLewdToChannel(channel, category);

          if (success) {
            const jitter = Math.random() * AUTOLEWD_POSTING_INTERVAL;
            autolewd.lastPostTime = now - jitter;
            await autolewd.save();

            container.logger.info(`Autolewd: Sent lewd to ${autolewd.guildId} in channel ${autolewd.channelId}`);
          } else throw new Error();
        } catch (error) {
          container.logger.error(`Error processing autolewd for ${autolewd.guildId}:`, error);
        }
      }
    } catch (error) {
      container.logger.error("Autolewd processing error:", error);
    }
  }
}

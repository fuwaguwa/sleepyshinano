import { container } from "@sapphire/framework";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, type Guild, type TextChannel } from "discord.js";
import { MAIN_GUILD_ID } from "../lib/constants";
import { fetchRandomLewd } from "../lib/utils/db";
import { getCurrentTimestamp, getRandomLewdCategory } from "../lib/utils/misc";
import Autolewd from "../schemas/Autolewd";
import User from "../schemas/User";
import type { LewdCategory, LewdMedia } from "../typings/lewd";

export class ShinanoAutoLewd {
  public async startLewdPosting() {
    container.logger.info("Initialized lewd posting...");

    const isDevelopment = process.env.NODE_ENV === "development";
    const intervalTime = isDevelopment ? 5000 : 300000;
    container.logger.debug(`NODE_ENV: ${process.env.NODE_ENV}, isDevelopment: ${isDevelopment}`);

    await this.processAutoLewd(isDevelopment);
    setInterval(async () => {
      await this.processAutoLewd(isDevelopment);
    }, intervalTime);
  }

  private async sendLewdToChannel(channel: TextChannel, category: LewdCategory | null): Promise<boolean> {
    const results = await fetchRandomLewd({ category });

    if (results.length === 0) {
      container.logger.error("No lewd found!");
      return false;
    }

    const media = results[0] as LewdMedia;

    if (media.format === "animated") {
      await channel.send({ content: media.link });
    } else {
      const embed = new EmbedBuilder()
        .setColor("Random")
        .setImage(media.link)
        .setFooter({ text: "Category: " + media.category })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    }

    return true;
  }

  private async processDevelopmentMode() {
    const testGuildId = "1002156534270267442";
    const testChannelId = "1456301697512116295";

    try {
      const guild = await container.client.guilds.fetch(testGuildId);
      const channel = await guild.channels.fetch(testChannelId);

      await this.sendLewdToChannel(channel as TextChannel, "hoyo");

      // if (success) container.logger.info(`Sent autolewd to dev channel`);
    } catch (error) {
      container.logger.error("Error in dev autolewd:", error);
    }
  }

  private async processAutoLewd(isDevelopment: boolean) {
    try {
      if (isDevelopment) return this.processDevelopmentMode();

      const mainGuild = await container.client.guilds.fetch(MAIN_GUILD_ID);
      const autolewds = await Autolewd.find().lean();

      for (const autolewd of autolewds) {
        try {
          // Check if guild exists
          let guild: Guild;
          try {
            guild = await container.client.guilds.fetch(autolewd.guildId);
          } catch (_) {
            container.logger.info(`Guild ${autolewd.guildId} not found, deleting entry...`);
            await Autolewd.deleteOne({ _id: autolewd._id });
            continue;
          }

          // Check if channel exists
          let channel: TextChannel;
          try {
            channel = (await guild.channels.fetch(autolewd.channelId)) as TextChannel;
          } catch (_) {
            container.logger.info(
              `Channel ${autolewd.channelId} is not text-based, deleting entry of ${autolewd.guildId}...`
            );
            await Autolewd.deleteOne({ _id: autolewd._id });
            continue;
          }

          // Check if channel is NSFW
          if (!channel?.nsfw) {
            const errorEmbed = new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                "❌ | This channel is NOT NSFW, please make this channel age-restricted and run `/autolewd` again"
              );

            await channel.send({ embeds: [errorEmbed] });
            await Autolewd.deleteOne({ _id: autolewd._id });
            container.logger.info(`Channel ${autolewd.channelId} is not NSFW, deleting entry of ${autolewd.guildId}`);
            continue;
          }

          // Check if user is in main server
          try {
            await mainGuild.members.fetch(autolewd.userId);
          } catch (_) {
            container.logger.info(
              `User ${autolewd.userId} is not in main server, deleting entry of ${autolewd.guildId}`
            );
            await Autolewd.deleteOne({ _id: autolewd._id });
            continue;
          }

          // Check vote status
          const user = await User.findOne({ userId: autolewd.userId });
          const currentTimestamp = getCurrentTimestamp();
          const isLowkACoolGuy = process.env.COOL_PEOPLE_IDS.split(",").includes(autolewd.userId);
          const validVote = user?.voteExpiredTimestamp && user.voteExpiredTimestamp >= currentTimestamp;

          if (!isLowkACoolGuy && !validVote) {
            if (!autolewd.sentNotVotedWarning) {
              const links = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setLabel("Vote on top.gg")
                  .setEmoji({ id: "1002849574517477447" })
                  .setURL(`https://top.gg/bot/1002193298229829682/vote`),
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Secondary)
                  .setLabel("Check top.gg Vote")
                  .setEmoji({ name: "🔍" })
                  .setCustomId("voteCheck")
              );

              const voteBro = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Vote expired!")
                .setDescription("❌ | Please vote for Shinano to continue posting!");

              await channel.send({
                content: `<@${autolewd.userId}>,`,
                embeds: [voteBro],
                components: [links],
              });

              await Autolewd.updateOne({ _id: autolewd._id }, { sentNotVotedWarning: true });
            }
            continue;
          }

          const category: LewdCategory =
            autolewd.category === "random" ? getRandomLewdCategory() : (autolewd.category as LewdCategory);
          const success = await this.sendLewdToChannel(channel, category);

          if (success) container.logger.info(`Sent lewd to ${autolewd.guildId}`);
        } catch (_) {
          container.logger.error(`Error processing autolewd for ${autolewd.guildId}`);
        }
      }
    } catch (error) {
      container.logger.error("Autolewd processing error:", error);
    }
  }
}

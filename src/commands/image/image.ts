import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand, type SubcommandOptions } from "@sapphire/plugin-subcommands";
import {
  ApplicationIntegrationType,
  AttachmentBuilder,
  EmbedBuilder,
  InteractionContextType,
  type User,
} from "discord.js";
import { buildSraUrl } from "../../lib/utils/http";
import type { ImageSendOptions } from "../../typings/image";

@ApplyOptions<SubcommandOptions>({
  description: "Image Generation & Manipulation Commands",
  cooldownLimit: 1,
  cooldownDelay: 6500,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(",") || [],
  preconditions: ["NotBlacklisted"],
  subcommands: [
    { name: "pixelate", chatInputRun: "subcommandPixelate" },
    { name: "border", chatInputRun: "subcommandBorder" },
    { name: "no", chatInputRun: "subcommandNo" },
    { name: "heart-crop", chatInputRun: "subcommandHeartCrop" },
    { name: "filter", chatInputRun: "subcommandFilter" },
    { name: "oogway", chatInputRun: "subcommandOogway" },
    { name: "horny-card", chatInputRun: "subcommandHornyCard" },
    { name: "simp-card", chatInputRun: "subcommandSimpCard" },
    { name: "namecard", chatInputRun: "subcommandNamecard" },
    { name: "comment", chatInputRun: "subcommandComment" },
    { name: "tweet", chatInputRun: "subcommandTweet" },
    { name: "gay", chatInputRun: "subcommandDefault" },
    { name: "jail", chatInputRun: "subcommandDefault" },
    { name: "wasted", chatInputRun: "subcommandDefault" },
    { name: "triggered", chatInputRun: "subcommandDefault" },
  ],
})
export class ImageCommand extends Subcommand {
  private target!: User;
  private avatar!: string;

  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([
          InteractionContextType.Guild,
          InteractionContextType.BotDM,
          InteractionContextType.PrivateChannel,
        ])
        .addSubcommand(command =>
          command
            .setName("pixelate")
            .setDescription("Make someone avatar looks lewd")
            .addUserOption(option => option.setName("user").setDescription("User to pixelate").setRequired(false))
        )
        .addSubcommand(command =>
          command
            .setName("border")
            .setDescription("Add a LGBT+ border to someone avatar.")
            .addStringOption(option =>
              option
                .setName("border-type")
                .setDescription("Type of border")
                .setRequired(true)
                .setChoices(
                  { name: "LGBT", value: "lgbt" },
                  { name: "Bisexual", value: "bisexual" },
                  { name: "Non-binary", value: "nonbinary" },
                  { name: "Pansexual", value: "pansexual" },
                  { name: "Transgender", value: "transgender" },
                  { name: "Lesbian", value: "lesbian" }
                )
            )
            .addUserOption(option =>
              option.setName("user").setDescription("User you want to add the border to").setRequired(false)
            )
        )
        .addSubcommand(command =>
          command
            .setName("no")
            .setDescription("No <item>?")
            .addStringOption(option => option.setName("item").setDescription("Item.").setRequired(true))
        )
        .addSubcommand(command =>
          command
            .setName("heart-crop")
            .setDescription("Crop someone avatar into a heart!")
            .addUserOption(option => option.setName("user").setDescription("User to be cropped").setRequired(false))
        )
        .addSubcommand(command =>
          command
            .setName("filter")
            .setDescription("Add some color filter to an avatar.")
            .addStringOption(option =>
              option
                .setName("filter")
                .setDescription("Filter to be added over.")
                .setRequired(true)
                .setChoices(
                  { name: "Blurple", value: "discordBlurpify" },
                  { name: "Sepia", value: "sepia" },
                  { name: "Red", value: "redify" },
                  { name: "Green", value: "greenify" },
                  { name: "Blue", value: "blueify" },
                  { name: "Invert", value: "invert" },
                  { name: "Greyscale", value: "greyscale" },
                  { name: "Invert and Greyscale", value: "invertGreyscale" }
                )
            )
            .addUserOption(option =>
              option.setName("user").setDescription("User to add the filter on").setRequired(false)
            )
        )
        .addSubcommand(command =>
          command
            .setName("oogway")
            .setDescription("Wise turtle")
            .addStringOption(option => option.setName("wisdom").setDescription("His wisdom.").setRequired(true))
        )
        .addSubcommand(command =>
          command
            .setName("horny-card")
            .setDescription("Grant someone the horny card")
            .addUserOption(option =>
              option.setName("user").setDescription("The person receiving the card").setRequired(false)
            )
        )
        .addSubcommand(command =>
          command
            .setName("simp-card")
            .setDescription("Give someone the simp card. Shame on them")
            .addUserOption(option =>
              option.setName("user").setDescription("The person receiving the card").setRequired(false)
            )
        )
        .addSubcommand(command =>
          command
            .setName("namecard")
            .setDescription("Generate a Genshin namecard.")
            .addStringOption(option =>
              option.setName("birthday").setDescription("The birthday to display on the namecard.").setRequired(true)
            )
            .addStringOption(option =>
              option.setName("signature").setDescription("The signature of the namecard").setRequired(true)
            )
            .addUserOption(option =>
              option.setName("user").setDescription("The user on the namecard").setRequired(false)
            )
        )
        .addSubcommand(command =>
          command
            .setName("comment")
            .setDescription("Generate a fake picture of a YouTube comment")
            .addStringOption(option => option.setName("content").setDescription("Comment content").setRequired(true))
            .addUserOption(option => option.setName("user").setDescription("The author").setRequired(false))
        )
        .addSubcommand(command =>
          command
            .setName("tweet")
            .setDescription("Generate a fake tweet")
            .addStringOption(option =>
              option.setName("display-name").setDescription("Display name of the user").setRequired(true)
            )
            .addStringOption(option =>
              option.setName("content").setDescription("Content of the tweet").setRequired(true)
            )
            .addIntegerOption(option => option.setName("replies").setDescription("Number of replies").setRequired(true))
            .addIntegerOption(option =>
              option.setName("retweets").setDescription("Number of retweets").setRequired(true)
            )
            .addIntegerOption(option => option.setName("likes").setDescription("Number of likes").setRequired(true))
            .addStringOption(option =>
              option
                .setName("theme")
                .setDescription("Theme of the tweet")
                .setRequired(false)
                .setChoices({ name: "Light", value: "light" }, { name: "Dark", value: "dark" })
            )
            .addUserOption(option => option.setName("user").setDescription("The author").setRequired(false))
        )
        .addSubcommand(command =>
          command
            .setName("gay")
            .setDescription("Apply gay filter to avatar")
            .addUserOption(option =>
              option.setName("user").setDescription("User to apply filter to").setRequired(false)
            )
        )
        .addSubcommand(command =>
          command
            .setName("jail")
            .setDescription("Put someone in jail")
            .addUserOption(option => option.setName("user").setDescription("The criminal").setRequired(false))
        )
        .addSubcommand(command =>
          command
            .setName("wasted")
            .setDescription("GTA wasted effect")
            .addUserOption(option => option.setName("user").setDescription("The victim").setRequired(false))
        )
        .addSubcommand(command =>
          command
            .setName("triggered")
            .setDescription("TRIGGERED")
            .addUserOption(option => option.setName("user").setDescription("Who's triggered?").setRequired(false))
        )
    );
  }

  /**
   * /image pixelate
   */
  public async subcommandPixelate(interaction: Subcommand.ChatInputCommandInteraction) {
    await this.initial(interaction);
    const link = this.sra("canvas/filter/pixelate");

    await this.send({ interaction, link });
  }

  /**
   * /image border
   */
  public async subcommandBorder(interaction: Subcommand.ChatInputCommandInteraction) {
    await this.initial(interaction);

    const borderType = interaction.options.getString("border-type", true);
    const link = this.sra(`canvas/misc/${borderType}`);
    await this.send({ interaction, link });
  }

  /**
   * /image no
   */
  public async subcommandNo(interaction: Subcommand.ChatInputCommandInteraction) {
    await this.initial(interaction);

    const text = interaction.options.getString("item", true);
    const link = this.sra("canvas/misc/no-bitches", { no: text });

    await this.send({ interaction, link });
  }

  /**
   * /image heart-crop
   */
  public async subcommandHeartCrop(interaction: Subcommand.ChatInputCommandInteraction) {
    await this.initial(interaction);
    const link = this.sra("canvas/misc/heart");

    await this.send({ interaction, link });
  }

  /**
   * /image filter
   */
  public async subcommandFilter(interaction: Subcommand.ChatInputCommandInteraction) {
    await this.initial(interaction);

    const filter = interaction.options.getString("filter", true);
    const link = this.sra(`canvas/filter/${filter}`);

    await this.send({ interaction, link });
  }

  /**
   * /image oogway
   */
  public async subcommandOogway(interaction: Subcommand.ChatInputCommandInteraction) {
    await this.initial(interaction);

    const type = Math.random() < 0.5 ? "1" : "2";
    const text = interaction.options.getString("wisdom", true);
    const link = this.sra("canvas/misc/oogway", { quote: text, type });

    await this.send({ interaction, link });
  }

  /**
   * /image horny-card
   */
  public async subcommandHornyCard(interaction: Subcommand.ChatInputCommandInteraction) {
    await this.initial(interaction);
    const link = this.sra("canvas/misc/horny");

    await this.send({ interaction, link });
  }

  /**
   * /image simp-card
   */
  public async subcommandSimpCard(interaction: Subcommand.ChatInputCommandInteraction) {
    await this.initial(interaction);
    const link = this.sra("canvas/misc/simpcard");

    await this.send({ interaction, link });
  }

  /**
   * /image namecard
   */
  public async subcommandNamecard(interaction: Subcommand.ChatInputCommandInteraction) {
    await this.initial(interaction);

    const birthday = interaction.options.getString("birthday", true);
    const description = interaction.options.getString("signature", true);
    const username = this.target.username;

    if (!/^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])$/.test(birthday)) {
      const failedEmbed = new EmbedBuilder().setColor("Red").setDescription("❌ | Birthday must be in `DD/MM` format!");
      return interaction.editReply({ embeds: [failedEmbed] });
    }

    const link = this.sra("canvas/misc/namecard", {
      username,
      birthday,
      description,
    });

    await this.send({ interaction, link });
  }

  /**
   * /image comment
   */
  public async subcommandComment(interaction: Subcommand.ChatInputCommandInteraction) {
    await this.initial(interaction);

    const content = interaction.options.getString("content", true);
    const username = this.target.username;
    const link = this.sra("canvas/misc/youtube-comment", {
      username,
      comment: content,
    });

    await this.send({ interaction, link });
  }

  /**
   * /image tweet
   */
  public async subcommandTweet(interaction: Subcommand.ChatInputCommandInteraction) {
    await this.initial(interaction);

    const displayName = interaction.options.getString("display-name", true);
    const username = this.target.username.toLowerCase();
    const content = interaction.options.getString("content", true);
    const replies = interaction.options.getInteger("replies", true);
    const retweets = interaction.options.getInteger("retweets", true);
    const likes = interaction.options.getInteger("likes", true);
    const theme = interaction.options.getString("theme") || "light";

    const link = this.sra("canvas/misc/tweet", {
      displayname: displayName,
      username,
      comment: content,
      replies,
      retweets,
      likes,
      theme,
    });

    await this.send({ interaction, link });
  }

  /**
   * /image gay, jail, wasted, triggered - Default overlay commands
   */
  public async subcommandDefault(interaction: Subcommand.ChatInputCommandInteraction) {
    await this.initial(interaction);

    const subcommand = interaction.options.getSubcommand();
    const link = this.sra(`canvas/overlay/${subcommand}`);

    await this.send({ interaction, link });
  }

  /**
   * Initialize interaction and get user/avatar
   */
  private async initial(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    this.target = interaction.options.getUser("user") || interaction.user;
    this.avatar = this.target.displayAvatarURL({
      size: 512,
      extension: "png",
      forceStatic: false,
    });
  }

  /**
   * Send the image as response
   */
  private async send({ interaction, image, link }: ImageSendOptions) {
    if (image) {
      const attachment = new AttachmentBuilder(image, { name: "image.png" });
      return interaction.editReply({ files: [attachment] });
    }

    const embed = new EmbedBuilder().setColor("#2b2d31").setImage(link ?? null);
    return interaction.editReply({ embeds: [embed] });
  }

  /**
   * Build a SomeRandomAPI URL with query parameters.
   * Automatically includes the target user's avatar if not provided.
   */
  private sra(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}) {
    const paramsWithAvatar = { avatar: this.avatar, ...params };
    return buildSraUrl(endpoint, paramsWithAvatar);
  }
}

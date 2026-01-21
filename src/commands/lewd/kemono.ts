import { ApplyOptions } from "@sapphire/decorators";
import { container } from "@sapphire/framework";
import { Subcommand, type SubcommandOptions } from "@sapphire/plugin-subcommands";
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  InteractionContextType,
  MediaGalleryBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import { buttonCollector } from "../../lib/collectors";
import { KEMONO, KEMONO_BASE_URL } from "../../lib/constants";
import { toTitleCase } from "../../lib/utils/misc";
import type { KemonoCreator, KemonoPost } from "../../structures/Kemono";
import { ShinanoPaginator } from "../../structures/Paginator";
import type { PostListItem } from "../../typings/kemono";

const KEMONO_INTERACTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

function generateCreatorSelections(
  creators: KemonoCreator[],
  userId: string
): { containers: ContainerBuilder[]; extraButtons: ActionRowBuilder<ButtonBuilder>[] } {
  const creatorContainers: ContainerBuilder[] = [];
  const creatorButtons: ActionRowBuilder<ButtonBuilder>[] = [];

  container.logger.debug(`Generating creator selections for ${creators.length} creators`);

  for (const [i, creator] of creators.entries()) {
    const creatorText = new TextDisplayBuilder().setContent(
      `## ${creator.name}\n\n` +
        `**Service**: ${toTitleCase(creator.service)}\n` +
        `**Favorited**: ${creator.favorited}\n\n` +
        `-# ID: ${creator.id}`
    );

    const creatorAvatar = new ThumbnailBuilder().setURL(creator.avatar);

    const creatorSection = new SectionBuilder()
      .addTextDisplayComponents(creatorText)
      .setThumbnailAccessory(creatorAvatar);

    const creatorContainer = new ContainerBuilder().addSectionComponents(creatorSection);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setEmoji("👀")
        .setLabel(`See ${creator.name} posts`)
        .setCustomId(`kmn-${i}-${userId}`),
      new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji("🔗").setLabel("Link to creator").setURL(creator.url)
    );

    creatorContainers.push(creatorContainer);
    creatorButtons.push(buttonRow);
  }

  return { containers: creatorContainers, extraButtons: creatorButtons };
}

function generatePostsSelections(
  creator: KemonoCreator,
  posts: PostListItem[],
  userId: string,
  showBackButton: boolean = false
): { containers: ContainerBuilder[]; extraButtons: ActionRowBuilder<ButtonBuilder>[] } {
  const postContainers: ContainerBuilder[] = [];
  const postButtons: ActionRowBuilder<ButtonBuilder>[] = [];

  container.logger.debug(`Generating post selections for ${posts.length} posts`);

  for (const [i, post] of posts.entries()) {
    const topText = new TextDisplayBuilder().setContent(`-# ${creator.name}'s post preview\n\n` + `## ${post.title}`);
    const creatorAvatar = new ThumbnailBuilder().setURL(creator.avatar);
    const section1 = new SectionBuilder().addTextDisplayComponents(topText).setThumbnailAccessory(creatorAvatar);
    const footerText = new TextDisplayBuilder().setContent(
      `-# Post ID: ${post.id} | Posted: <t:${new Date(post.published).getTime() / 1000}:R>`
    );
    const previewImage = new MediaGalleryBuilder().addItems([
      { media: { url: `${KEMONO_BASE_URL}/data${post.file.path}` } },
    ]);
    const separator = new SeparatorBuilder();

    const creatorContainer = new ContainerBuilder()
      .addSectionComponents(section1)
      .addSeparatorComponents(separator)
      .addMediaGalleryComponents(previewImage)
      .addTextDisplayComponents(footerText);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setEmoji("👀")
        .setLabel(`See this post`)
        .setCustomId(`kmn-post-${i}-${userId}`),

      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setEmoji("🔗")
        .setLabel("Link to this post")
        .setURL(`${KEMONO_BASE_URL}/${creator.service}/user/${creator.id}/post/${post.id}`)
    );

    if (showBackButton) {
      const backButtonRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("⬅️")
          .setLabel("Return")
          .setCustomId(`kmn-back-creators-${userId}`)
      );
      buttonRow.addComponents(backButtonRow.components[0]);
    }

    postContainers.push(creatorContainer);
    postButtons.push(buttonRow);
  }

  return { containers: postContainers, extraButtons: postButtons };
}

function generatePostContentDisplay(
  creator: KemonoCreator,
  post: KemonoPost,
  userId: string,
  postPage?: number
): { containers: ContainerBuilder[]; extraButtons?: ActionRowBuilder<ButtonBuilder>[] } {
  const postNumberText = postPage !== undefined ? ` | Post #${postPage + 1}` : "";
  const topText = new TextDisplayBuilder().setContent(
    `-# Creator: ${creator.name}${postNumberText}\n\n` + `## ${post.title}`
  );
  const creatorAvatar = new ThumbnailBuilder().setURL(creator.avatar);
  const footer = new TextDisplayBuilder().setContent(`-# Post ID: ${post.id} | Posted: <t:${post.date}:R>`);
  const separator = new SeparatorBuilder();
  const section1 = new SectionBuilder().addTextDisplayComponents(topText).setThumbnailAccessory(creatorAvatar);

  const basePage = new ContainerBuilder().addSectionComponents(section1).addSeparatorComponents(separator);
  const firstPage = new ContainerBuilder(basePage.toJSON());

  if (post.content) {
    const postTextContent = new TextDisplayBuilder().setContent(post.content);
    firstPage.addTextDisplayComponents(postTextContent);
  }

  if (post.previewUrl) {
    const preview = new MediaGalleryBuilder().addItems([{ media: { url: post.previewUrl } }]);
    firstPage.addMediaGalleryComponents(preview);
  }

  firstPage.addTextDisplayComponents(footer);
  const containers: ContainerBuilder[] = [firstPage];

  const mediaExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm"];
  const allAttachments = post.attachments.filter(att => !att.url.endsWith(".bin"));

  const mediaFiles = allAttachments.filter(att => mediaExtensions.some(ext => att.url.toLowerCase().endsWith(ext)));
  const downloadFiles = allAttachments.filter(att => !mediaExtensions.some(ext => att.url.toLowerCase().endsWith(ext)));

  const downloadButtonRows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < downloadFiles.length; i += 5) {
    const filesInRow = downloadFiles.slice(i, i + 5);
    const buttonRow = new ActionRowBuilder<ButtonBuilder>();

    for (const file of filesInRow) {
      const fileName = file.name || file.url.split("/").pop() || "file";

      buttonRow.addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji("🔗").setLabel(fileName).setURL(file.url)
      );
    }

    downloadButtonRows.push(buttonRow);
  }

  if (mediaFiles.length > 0) {
    for (let i = 0; i < mediaFiles.length; i += 10) {
      const pageAttachments = mediaFiles.slice(i, i + 10);
      const attachmentPage = new ContainerBuilder(basePage.toJSON());

      if (i === 0 && downloadButtonRows.length > 0) {
        for (const buttonRow of downloadButtonRows) {
          attachmentPage.addActionRowComponents(buttonRow);
        }
        attachmentPage.addSeparatorComponents(separator);
      }

      const gallery = new MediaGalleryBuilder();
      for (const attachment of pageAttachments) {
        gallery.addItems([{ media: { url: attachment.url } }]);
      }

      attachmentPage.addMediaGalleryComponents(gallery).addTextDisplayComponents(footer);

      containers.push(attachmentPage);
    }
  } else if (downloadButtonRows.length > 0) {
    const downloadOnlyPage = new ContainerBuilder(basePage.toJSON());
    for (const buttonRow of downloadButtonRows) {
      downloadOnlyPage.addActionRowComponents(buttonRow);
    }
    downloadOnlyPage.addTextDisplayComponents(footer);
    containers.push(downloadOnlyPage);
  }

  const backButton = new ActionRowBuilder<ButtonBuilder>().setComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setEmoji("🔗")
      .setLabel("Link to this post")
      .setURL(`${KEMONO_BASE_URL}/${creator.service}/user/${creator.id}/post/${post.id}`),
    new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⬅️")
      .setLabel("Return")
      .setCustomId(`kmn-back-posts-${userId}`)
  );

  const extraButtons = Array(containers.length).fill(backButton);

  return { containers, extraButtons };
}

@ApplyOptions<SubcommandOptions>({
  description: "Fetches content from kemono.party",
  fullCategory: ["PremiumNSFW"],
  preconditions: ["NotBlacklisted", "Voted"],
  cooldownLimit: 1,
  cooldownDelay: 30000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(","),
  subcommands: [{ name: "creator", chatInputRun: "subcommandCreator" }],
})
export class KemonoCommand extends Subcommand {
  public override async registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setNSFW(true)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .setContexts([InteractionContextType.Guild])
        .addSubcommand(command =>
          command
            .setName("creator")
            .setDescription("Fetches a creator from kemono.party and their posts")
            .addStringOption(option =>
              option.setName("name").setDescription("The name of the creator").setRequired(true).setAutocomplete(true)
            )
            .addIntegerOption(option =>
              option
                .setName("id")
                .setDescription("The ID of the creator. This field will override name")
                .setRequired(false)
            )
        )
    );
  }

  public async subcommandCreator(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    const creatorName = interaction.options.getString("name", true);
    const creatorId = interaction.options.getInteger("id");

    const splitName = creatorName.split("-");
    const nameType = splitName[0];

    if (nameType === "id" || creatorId) {
      const searchId = creatorId?.toString() ?? splitName[1];

      const creator = KEMONO.getCreatorById(searchId);

      if (!creator) {
        const errorText = new TextDisplayBuilder().setContent("❌️ Something has went wrong...");
        const errorContainer = new ContainerBuilder().addTextDisplayComponents(errorText);
        return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [errorContainer] });
      }

      return this.showPostsSelection(interaction, creator, [creator]);
    }

    const searchResults = await KEMONO.searchCreator(splitName[1], creatorId?.toString());
    if (!searchResults || searchResults.length === 0) {
      const noResultText = new TextDisplayBuilder().setContent(`❌️ No creators found for the name: **${creatorName}**`);
      const container1 = new ContainerBuilder().addTextDisplayComponents(noResultText).setAccentColor([255, 0, 0]);
      return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container1] });
    }

    await this.showCreatorSelection(interaction, searchResults);
  }

  private async showCreatorSelection(
    interaction: Subcommand.ChatInputCommandInteraction,
    searchResults: KemonoCreator[],
    startPage?: number
  ) {
    const creatorSelections = generateCreatorSelections(searchResults, interaction.user.id);

    const creatorSelectionPaginator = new ShinanoPaginator({
      interaction,
      pageCountName: "Creator",
      pages: creatorSelections.containers,
      extraButtons: creatorSelections.extraButtons,
      interactorOnly: true,
      timeout: KEMONO_INTERACTION_TIMEOUT,
      startPage,
    });

    creatorSelectionPaginator.startPaginator();

    const message = await interaction.fetchReply();
    const creatorCollector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: KEMONO_INTERACTION_TIMEOUT,
    });

    buttonCollector.set(interaction.user.id, creatorCollector);

    creatorCollector.on("collect", async i => {
      if (!i.customId.endsWith(i.user.id)) {
        return i.reply({
          flags: MessageFlags.Ephemeral,
          content: "This button does not belong to you!",
        });
      }

      this.container.logger.debug(`Button collected with customId: ${i.customId}`);
      if (!i.customId.startsWith("kmn")) return;

      await i.deferUpdate();

      const creatorIdx = i.customId.split("-")[1];
      this.container.logger.debug(`User selected creator index: ${creatorIdx}`);

      creatorCollector.stop(`selected-${creatorIdx}`);
    });

    creatorCollector.on("end", async (_, reason) => {
      const splitReason = reason.split("-");
      const status = splitReason[0];
      if (status !== "selected") return;

      const creatorPage = creatorSelectionPaginator.getCurrentPage();
      creatorSelectionPaginator.stopPaginator(false);
      const creatorIdx = splitReason[1];
      const selectedCreator = searchResults[Number(creatorIdx)];

      await this.processCreatorSelection(interaction, selectedCreator, searchResults, creatorPage);
    });
  }

  private async processCreatorSelection(
    interaction: Subcommand.ChatInputCommandInteraction,
    selectedCreator: KemonoCreator,
    searchResults: KemonoCreator[],
    creatorPage?: number
  ) {
    await this.showPostsSelection(interaction, selectedCreator, searchResults, creatorPage);
  }

  private async showPostsSelection(
    interaction: Subcommand.ChatInputCommandInteraction,
    creator: KemonoCreator,
    searchResults: KemonoCreator[],
    creatorPage?: number,
    startPage?: number
  ) {
    const posts = await creator.getPosts();

    if (!posts) {
      const noPostText = new TextDisplayBuilder().setContent("❌️ No posts found for this creator!");
      const noPostContainer = new ContainerBuilder().addTextDisplayComponents(noPostText);
      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [noPostContainer] });
      return;
    }

    const postsSelections = generatePostsSelections(
      creator,
      posts as PostListItem[],
      interaction.user.id,
      creatorPage !== undefined
    );

    const postSelectionPaginator = new ShinanoPaginator({
      interaction,
      pageCountName: "Post",
      pages: postsSelections.containers,
      extraButtons: postsSelections.extraButtons,
      interactorOnly: true,
      timeout: KEMONO_INTERACTION_TIMEOUT,
      startPage,
    });

    postSelectionPaginator.startPaginator();

    const message = await interaction.fetchReply();
    const postCollector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: KEMONO_INTERACTION_TIMEOUT,
    });

    buttonCollector.set(interaction.user.id, postCollector);

    postCollector.on("collect", async i => {
      if (!i.customId.endsWith(i.user.id)) {
        return i.reply({
          flags: MessageFlags.Ephemeral,
          content: "This button does not belong to you!",
        });
      }

      this.container.logger.debug(`Button collected with customId: ${i.customId}`);

      if (i.customId.startsWith("kmn-back-creators")) {
        await i.deferUpdate();
        postCollector.stop("back");
        return;
      }

      if (!i.customId.startsWith("kmn-post")) return;

      await i.deferUpdate();

      const postIdx = i.customId.split("-")[2];
      this.container.logger.debug(`User selected post index: ${postIdx}`);

      postCollector.stop(`selected-${postIdx}`);
    });

    postCollector.on("end", async (_, reason) => {
      if (reason === "back") {
        postSelectionPaginator.stopPaginator(false);
        await this.showCreatorSelection(interaction, searchResults, creatorPage);
        return;
      }

      const splitReason = reason.split("-");
      const status = splitReason[0];
      if (status !== "selected") return;

      const postPage = postSelectionPaginator.getCurrentPage();
      postSelectionPaginator.stopPaginator(false);
      const postIdx = splitReason[1];

      const post = await creator.getPost(posts[Number(postIdx)].id);

      if (!post) {
        const noPostText = new TextDisplayBuilder().setContent("❌️ Post content not found!");
        const noPostContainer = new ContainerBuilder().addTextDisplayComponents(noPostText);
        await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [noPostContainer] });
        return;
      }

      await this.showPostContent(interaction, creator, post, searchResults, creatorPage, postPage);
    });
  }

  private async showPostContent(
    interaction: Subcommand.ChatInputCommandInteraction,
    creator: KemonoCreator,
    post: KemonoPost,
    searchResults: KemonoCreator[],
    creatorPage?: number,
    postPage?: number
  ) {
    const { containers, extraButtons } = generatePostContentDisplay(creator, post, interaction.user.id, postPage);

    const postContentPaginator = new ShinanoPaginator({
      interaction,
      pageCountName: "Post Content",
      pages: containers,
      extraButtons,
      interactorOnly: true,
      timeout: KEMONO_INTERACTION_TIMEOUT,
    });

    postContentPaginator.startPaginator();

    const message = await interaction.fetchReply();
    const contentCollector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: KEMONO_INTERACTION_TIMEOUT,
    });

    buttonCollector.set(interaction.user.id, contentCollector);

    contentCollector.on("collect", async i => {
      if (!i.customId.endsWith(i.user.id)) {
        return i.reply({
          flags: MessageFlags.Ephemeral,
          content: "This button does not belong to you!",
        });
      }

      if (i.customId.startsWith("kmn-back-posts")) {
        await i.deferUpdate();
        contentCollector.stop("back");
      }
    });

    contentCollector.on("end", async (_, reason) => {
      if (reason === "back") {
        postContentPaginator.stopPaginator(false);
        await this.showPostsSelection(interaction, creator, searchResults, creatorPage, postPage);
      }
    });
  }
}

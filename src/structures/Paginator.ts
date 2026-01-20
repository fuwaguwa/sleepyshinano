import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  type InteractionEditReplyOptions,
  type Message,
  type MessageComponentInteraction,
  MessageFlags,
  MessageFlagsBitField,
  type MessagePayload,
  type StringSelectMenuBuilder,
} from "discord.js";
import { paginationCollector } from "../lib/collectors";
import type { ShinanoPaginatorOptions } from "../typings/paginator";

export class ShinanoPaginator {
  private readonly interaction: ChatInputCommandInteraction;
  private readonly pages: ContainerBuilder[];
  private readonly extraButtons?: ActionRowBuilder<ButtonBuilder>[];
  private readonly payloads?: MessagePayload[] | string[] | InteractionEditReplyOptions[];
  private readonly menu?: ActionRowBuilder<StringSelectMenuBuilder>;
  private readonly interactorOnly: boolean;
  private readonly timeout: number;
  private readonly menuId?: string;

  private collector!: ReturnType<Message["createMessageComponentCollector"]>;
  private currentPage: number;
  private navigationRow!: ActionRowBuilder<ButtonBuilder>;
  private navigationButtons!: ButtonBuilder[];

  constructor(options: ShinanoPaginatorOptions) {
    this.interaction = options.interaction;
    this.pages = options.pages ?? [];
    this.extraButtons = options.extraButtons;
    this.payloads = options.payloads;
    this.menu = options.menu;
    this.interactorOnly = options.interactorOnly ?? false;
    this.timeout = options.timeout;
    this.currentPage = options.startPage ?? 0;

    if (this.menu) this.menuId = this.menu.components[0].data.custom_id?.split("-")[0];
  }

  public async startPaginator(): Promise<number> {
    if (!this.interaction.deferred) await this.interaction.deferReply();

    this.initializeButtons();
    this.updateButtonStates();

    const message = await this.sendInitialMessage();

    if (this.pages.length === 0) return this.currentPage;

    return this.setupCollector(message);
  }

  public async stopPaginator(hideComponents: boolean) {
    // Stop collector if running
    if (this.collector && !this.collector.ended) {
      this.collector.stop("stopped by stopPaginator");
    }
    if (hideComponents) {
      await this.interaction.editReply({ components: [] });
      return;
    }

    // Clone the original container to avoid mutating it
    const originalContainer = this.pages[this.currentPage];
    const clonedContainer = new ContainerBuilder(originalContainer.toJSON());

    // Disable menu if present (all components) - ABOVE navigation
    if (this.menu) {
      this.menu.components.forEach(component => {
        component.setDisabled(true);
      });
      clonedContainer.addActionRowComponents(this.menu);
    }

    // Disable all paginator navigation buttons
    this.navigationButtons.forEach(button => {
      button.setStyle(ButtonStyle.Secondary).setDisabled(true);
    });
    clonedContainer.addActionRowComponents(this.navigationRow);

    // Disable extraButtons if present for this page - BELOW navigation
    if (this.extraButtons?.[this.currentPage]) {
      this.extraButtons[this.currentPage].components.forEach(btn => {
        btn.setDisabled(true);
      });
      clonedContainer.addActionRowComponents(this.extraButtons[this.currentPage]);
    }
    await this.interaction.editReply({ components: [clonedContainer], flags: MessageFlags.IsComponentsV2 });
  }

  private initializeButtons() {
    const userId = this.interaction.user.id;

    this.navigationRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji({ id: "1002197527732437052" })
        .setCustomId(`FIRST-${userId}`),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji({ id: "1002197531335327805" })
        .setCustomId(`BACK-${userId}`),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
        .setCustomId("pagecount")
        .setLabel(`Page: ${this.currentPage + 1}/${this.pages.length}`),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji({ id: "1002197525345865790" })
        .setCustomId(`NEXT-${userId}`),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setEmoji({ id: "1002197529095577612" })
        .setCustomId(`LAST-${userId}`)
    );

    this.navigationButtons = this.navigationRow.components;
  }

  private updateButtonStates() {
    const isFirstPage = this.currentPage === 0;
    const isLastPage = this.currentPage === this.pages.length - 1;
    const isSinglePage = this.pages.length === 1;

    if (isSinglePage)
      this.navigationButtons.forEach(button => {
        button.setStyle(ButtonStyle.Secondary).setDisabled(true);
      });

    // First and Back button
    this.navigationButtons[0].setDisabled(isFirstPage);
    this.navigationButtons[1].setDisabled(isFirstPage);

    // Next and Last buttons
    this.navigationButtons[3].setDisabled(isLastPage);
    this.navigationButtons[4].setDisabled(isLastPage);

    // Update page counter
    this.navigationButtons[2].setLabel(`Page: ${this.currentPage + 1}/${this.pages.length}`);
  }

  // Obsolete
  // private buildComponents() {}

  private buildContainerPayload(): { components: ContainerBuilder[] } {
    // Clone the original container to avoid mutating it on each page change
    const originalContainer = this.pages[this.currentPage];
    const clonedContainer = new ContainerBuilder(originalContainer.toJSON());

    // Add menu and navigation/extra buttons as action rows inside the container
    if (this.menu) clonedContainer.addActionRowComponents(this.menu);
    clonedContainer.addActionRowComponents(this.navigationRow);
    if (this.extraButtons?.[this.currentPage])
      clonedContainer.addActionRowComponents(this.extraButtons[this.currentPage]);

    return { components: [clonedContainer] };
  }

  private getMessagePayload(): InteractionEditReplyOptions {
    // If custom payloads are used, user must provide the full payload with flags
    if (this.payloads) return Object.assign({}, this.payloads[this.currentPage]) as InteractionEditReplyOptions;

    return {
      ...this.buildContainerPayload(),
      flags: MessageFlags.IsComponentsV2,
    };
  }

  private async sendInitialMessage() {
    return await this.interaction.editReply(this.getMessagePayload());
  }

  private async setupCollector(message: Message): Promise<number> {
    return new Promise(resolve => {
      this.collector = message.createMessageComponentCollector({ time: this.timeout });

      const collector = this.collector;

      paginationCollector.set(this.interaction.user.id, collector);

      collector.on("collect", async (i: MessageComponentInteraction) => {
        const interactionSuccess = await this.handleInteraction(i, collector);

        if (!interactionSuccess) resolve(this.currentPage);
      });

      collector.on("end", async (_, reason: string) => {
        await this.handleCollectorEnd(reason);
      });
    });
  }

  private async handleInteraction(
    i: MessageComponentInteraction,
    collector: ReturnType<Message["createMessageComponentCollector"]>
  ): Promise<boolean> {
    const [action, userId] = i.customId.split("-");

    if (action === this.menuId) {
      collector.stop("interaction ended");
      this.currentPage = 0;

      return false;
    }

    if (this.interactorOnly && userId !== i.user.id) {
      await i.reply({
        content: "This button does not belong to you!",
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });

      return true;
    }

    this.handlePageChange(action);

    await i.deferUpdate();
    this.updateButtonStates();
    await i.editReply(this.getMessagePayload());

    collector.resetTimer();
    return true;
  }

  private async handlePageChange(action: string) {
    switch (action) {
      case "BACK":
        this.currentPage--;
        break;
      case "NEXT":
        this.currentPage++;
        break;
      case "FIRST":
        this.currentPage = 0;
        break;
      case "LAST":
        this.currentPage = this.pages.length - 1;
        break;
    }
  }

  private async handleCollectorEnd(reason: string) {
    if (["messageDelete", "interaction ended"].includes(reason)) return;

    // Clone the original container to avoid mutating it
    const originalContainer = this.pages[this.currentPage];
    const clonedContainer = new ContainerBuilder(originalContainer.toJSON());

    // Disable menu - ABOVE navigation
    if (this.menu) {
      this.menu.components.forEach(component => {
        component.setDisabled(true);
      });
      clonedContainer.addActionRowComponents(this.menu);
    }

    // Disable navigation buttons
    this.navigationButtons.forEach(button => {
      button.setStyle(ButtonStyle.Secondary).setDisabled(true);
    });
    clonedContainer.addActionRowComponents(this.navigationRow);

    // Disable extra buttons if present - BELOW navigation
    if (this.extraButtons?.[this.currentPage]) {
      this.extraButtons[this.currentPage].components.forEach(btn => {
        btn.setDisabled(true);
      });
      clonedContainer.addActionRowComponents(this.extraButtons[this.currentPage]);
    }
    await this.interaction.editReply({ components: [clonedContainer], flags: MessageFlags.IsComponentsV2 });
  }
}

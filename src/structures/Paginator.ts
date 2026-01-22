import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  type InteractionEditReplyOptions,
  LabelBuilder,
  type Message,
  type MessageComponentInteraction,
  MessageFlags,
  type MessagePayload,
  ModalBuilder,
  SeparatorBuilder,
  type StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
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
  private readonly pageCountName: string;

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
    this.pageCountName = options.pageCountName ?? "Page";

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
    if (this.collector && !this.collector.ended) {
      this.collector.stop("stopped by stopPaginator");
    }
    if (hideComponents) {
      await this.interaction.editReply({ components: [] });
      return;
    }

    const originalContainer = this.pages[this.currentPage];
    const clonedContainer = new ContainerBuilder(originalContainer.toJSON());

    if (this.menu) {
      this.menu.components.forEach(component => {
        component.setDisabled(true);
      });
      clonedContainer.addActionRowComponents(this.menu);
    }

    const separator = new SeparatorBuilder();
    clonedContainer.addSeparatorComponents(separator);

    this.navigationButtons.forEach(button => {
      button.setStyle(ButtonStyle.Secondary).setDisabled(true);
    });
    clonedContainer.addActionRowComponents(this.navigationRow);

    if (this.extraButtons?.[this.currentPage]) {
      this.extraButtons[this.currentPage].components.forEach(btn => {
        btn.setDisabled(true);
      });
      clonedContainer.addActionRowComponents(this.extraButtons[this.currentPage]);
    }
    await this.interaction.editReply({ components: [clonedContainer], flags: MessageFlags.IsComponentsV2 });
  }

  public getCurrentPage(): number {
    return this.currentPage;
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
        .setCustomId(`PAGECOUNT-${userId}`)
        .setLabel(`${this.pageCountName}: ${this.currentPage + 1}/${this.pages.length}`),
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
    this.navigationButtons[2].setLabel(`${this.pageCountName}: ${this.currentPage + 1}/${this.pages.length}`);
  }

  private buildContainerPayload(): { components: ContainerBuilder[] } {
    // Clone the original container to avoid mutating it on each page change
    const originalContainer = this.pages[this.currentPage];
    const clonedContainer = new ContainerBuilder(originalContainer.toJSON());

    if (this.menu) clonedContainer.addActionRowComponents(this.menu);

    const separator = new SeparatorBuilder();
    clonedContainer.addSeparatorComponents(separator);
    clonedContainer.addActionRowComponents(this.navigationRow);
    if (this.extraButtons?.[this.currentPage])
      clonedContainer.addActionRowComponents(this.extraButtons[this.currentPage]);

    return { components: [clonedContainer] };
  }

  private getMessagePayload(): InteractionEditReplyOptions {
    // Must provide full payload with flags if payloads are used
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
        const splitId = i.customId.split("-")[0];
        if (!["FIRST", "BACK", "NEXT", "LAST", "PAGECOUNT"].includes(splitId) && splitId !== this.menuId) return;
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
    const splitId = i.customId.split("-");
    const action = splitId[0];

    if (action === this.menuId) {
      collector.stop("interaction ended");
      this.currentPage = 0;

      return false;
    }

    if (this.interactorOnly && !i.customId.endsWith(i.user.id)) {
      await i.reply({
        content: "This button does not belong to you!",
        flags: MessageFlags.Ephemeral,
      });

      return true;
    }

    if (action === "PAGECOUNT") {
      await this.showPageJumpModal(i, collector);
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

  private async showPageJumpModal(
    i: MessageComponentInteraction,
    collector: ReturnType<Message["createMessageComponentCollector"]>
  ) {
    const modal = new ModalBuilder().setCustomId(`pagejump-${i.user.id}`).setTitle(`${this.pageCountName} Selection`);

    const pageInput = new TextInputBuilder()
      .setCustomId("pageNumber")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(`1-${this.pages.length}`)
      .setRequired(true);

    const label = new LabelBuilder()
      .setLabel(`Enter ${this.pageCountName.toLowerCase()}`)
      .setTextInputComponent(pageInput);

    modal.addLabelComponents(label);

    await i.showModal(modal);

    const modalFilter = (modalInteraction: any) => modalInteraction.customId === `pagejump-${i.user.id}`;

    try {
      const modalSubmit = await i.awaitModalSubmit({ filter: modalFilter, time: 60000 });

      const pageNumberInput = modalSubmit.fields.getTextInputValue("pageNumber");
      const pageNumber = Number.parseInt(pageNumberInput, 10);

      if (Number.isNaN(pageNumber) || pageNumber < 1 || pageNumber > this.pages.length) {
        await modalSubmit.reply({
          content: "The value you entered is invalid, please try again",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      this.currentPage = pageNumber - 1;

      await modalSubmit.deferUpdate();
      this.updateButtonStates();
      await modalSubmit.editReply(this.getMessagePayload());

      collector.resetTimer();
    } catch (_) {
      return;
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

    const separator = new SeparatorBuilder();
    clonedContainer.addSeparatorComponents(separator);

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

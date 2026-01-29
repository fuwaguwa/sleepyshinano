import fs from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { createCanvas, type Image, loadImage } from "@napi-rs/canvas";
import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  ApplicationIntegrationType,
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  InteractionContextType,
  MediaGalleryBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";
import GIFEncoder from "gif-encoder-2";
import { PETPET_DELAY, PETPET_FRAME_COUNT, PETPET_FRAMES_PATH, PETPET_SIZE } from "../constants";

/**
 * Read all chunks from a Readable stream and concat them into one Buffer.
 */
async function collectStream(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c: Buffer) => chunks.push(Buffer.from(c)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (err: Error) => reject(err));
  });
}

// Cache for overlay frames
const framesCache = new Map<string, Image[]>();
const framesLoading = new Map<string, Promise<Image[]>>();

async function loadFrames(framesPath: string, frameCount: number): Promise<Image[]> {
  const key = `${framesPath}:${frameCount}`;
  const cached = framesCache.get(key);
  if (cached) return cached;
  const inFlight = framesLoading.get(key);
  if (inFlight) return inFlight;
  const p = (async (): Promise<Image[]> => {
    const frameFiles = Array.from({ length: frameCount }, (_, i) => path.join(framesPath, `pet${i}.gif`));
    await Promise.all(
      frameFiles.map(async p => {
        try {
          await fs.access(p);
        } catch (_err) {
          throw new Error(`Missing frame file: ${p}`);
        }
      })
    );
    const imgs = await Promise.all(frameFiles.map(f => loadImage(f)));
    framesCache.set(key, imgs);
    framesLoading.delete(key);
    return imgs;
  })();
  framesLoading.set(key, p);
  return p;
}

@ApplyOptions<CommandOptions>({
  description: "Create a petpet gif from a user avatar",
  cooldownDelay: 15000,
  preconditions: ["NotBlacklisted"],
})
export class PetpetCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
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
        .addUserOption(option => option.setName("user").setDescription("User to pet").setRequired(false))
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();
    const target = interaction.options.getUser("user") || interaction.user;
    const avatar = target.displayAvatarURL({
      size: 512,
      extension: "png",
      forceStatic: true,
    });
    try {
      const frames: Image[] = await loadFrames(PETPET_FRAMES_PATH, PETPET_FRAME_COUNT);
      const avatarImage = await loadImage(avatar);
      const canvas = createCanvas(PETPET_SIZE, PETPET_SIZE);
      const avatarSize = avatarImage.width;
      const frameCount = frames.length;

      const ctx = canvas.getContext("2d");
      const encoder = new GIFEncoder(PETPET_SIZE, PETPET_SIZE, "octree", true, frameCount);
      encoder.setRepeat(0);
      encoder.setDelay(PETPET_DELAY);
      encoder.setQuality(10);

      const outStream: Readable | null = encoder.createReadStream();
      encoder.start();
      for (let i = 0; i < frameCount; i++) {
        // Petpet animation transformations
        const j = i < frameCount / 2 ? i : frameCount - i;
        const widthScale = 0.8 + j * 0.02;
        const heightScale = 0.8 - j * 0.05;
        const offsetX = (1 - widthScale) * 0.5 + 0.1;
        const offsetY = 1 - heightScale - 0.08;
        ctx.clearRect(0, 0, PETPET_SIZE, PETPET_SIZE);
        const avatarDrawW = Math.round(widthScale * PETPET_SIZE);
        const avatarDrawH = Math.round(heightScale * PETPET_SIZE);
        const avatarDrawX = Math.round(offsetX * PETPET_SIZE);
        const avatarDrawY = Math.round(offsetY * PETPET_SIZE);
        ctx.drawImage(avatarImage, 0, 0, avatarSize, avatarSize, avatarDrawX, avatarDrawY, avatarDrawW, avatarDrawH);
        ctx.drawImage(frames[i], 0, 0, PETPET_SIZE, PETPET_SIZE);
        encoder.addFrame(ctx);
      }
      encoder.finish();

      const buffer: Buffer = await collectStream(outStream);
      const attachment = new AttachmentBuilder(buffer, { name: "petpet.gif" });
      const petpetGif = new MediaGalleryBuilder().addItems([
        {
          media: {
            url: "attachment://petpet.gif",
          },
        },
      ]);

      const containerComponent = new ContainerBuilder().addMediaGalleryComponents(petpetGif);
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [containerComponent],
        files: [attachment],
      });
    } catch (err) {
      const errorMessage = new TextDisplayBuilder().setContent("❌ | Failed to create petpet gif.");
      const containerComponent = new ContainerBuilder()
        .addTextDisplayComponents(errorMessage)
        .setAccentColor([255, 0, 0]);
      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
      throw err;
    }
  }
}

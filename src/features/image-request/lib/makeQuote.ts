import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { ImageQuoteOptions } from "../types/Image";

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 675;
const AVATAR_WIDTH_PERCENT = 0.52;
const TEXT_CENTER_PERCENT = 0.3;
const TEXT_MAX_WIDTH = 520;
const OVERLAY_PATH = path.join(process.cwd(), "data", "makeQuote", "overlay.png");

export async function createQuoteImage({ text, username, avatarUrl }: ImageQuoteOptions): Promise<Buffer> {
  const avatarResponse = await fetch(avatarUrl);
  const avatarBuffer = Buffer.from(await avatarResponse.arrayBuffer());

  const processedAvatar = await sharp(avatarBuffer)
    .resize(Math.round(IMAGE_WIDTH * AVATAR_WIDTH_PERCENT), IMAGE_HEIGHT, { fit: "cover", position: "center" })
    .grayscale()
    .toBuffer();

  const overlayBuffer = await fs.readFile(OVERLAY_PATH);

  const calculateFontSize = (textLength: number): number => {
    if (textLength < 30) return 48;
    if (textLength < 60) return 44;
    if (textLength < 100) return 40;
    if (textLength < 150) return 36;
    if (textLength < 200) return 32;
    return 30;
  };

  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    const avgCharWidth = fontSize * 0.5;

    for (const word of words) {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      const estimatedWidth = testLine.length * avgCharWidth;

      // Only break if we exceed max width
      if (estimatedWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Escape XML special characters
  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const textAreaCenter = IMAGE_WIDTH * (1 - TEXT_CENTER_PERCENT);

  const fontSize = calculateFontSize(text.length);
  const lines = wrapText(text, TEXT_MAX_WIDTH, fontSize);

  const lineHeight = fontSize * 1.2;
  const totalTextHeight = lines.length * lineHeight;
  const usernameGap = 30;
  const usernameHeight = 32;
  const totalContentHeight = totalTextHeight + usernameGap + usernameHeight;
  const startY = (IMAGE_HEIGHT - totalContentHeight) / 2 + fontSize;

  const textSvg = `
    <svg width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}">
      <defs>
        <style>
          .quote-text { 
            fill: white; 
            font-family: Arial, Helvetica, sans-serif; 
            font-size: ${fontSize}px; 
            font-weight: 400;
            text-anchor: middle;
          }
          .username { 
            fill: #cccccc; 
            font-family: Arial, Helvetica, sans-serif; 
            font-size: 32px; 
            font-style: italic;
            text-anchor: middle;
          }
          .watermark { 
            fill: #666666; 
            font-family: Arial, Helvetica, sans-serif; 
            font-size: 16px;
          }
        </style>
      </defs>
      
      <!-- Quote text lines -->
      ${lines
        .map(
          (line, i) =>
            `<text x="${textAreaCenter}" y="${startY + i * lineHeight}" class="quote-text">${escapeXml(line)}</text>`
        )
        .join("\n")}
      
      <!-- Username attribution -->
      <text x="${textAreaCenter}" y="${startY + totalTextHeight + usernameGap}" class="username">- ${escapeXml(username)}</text>
      
      <!-- Watermark -->
      <text x="${IMAGE_WIDTH - 20}" y="${IMAGE_HEIGHT - 20}" class="watermark" text-anchor="end">@Shinano</text>
    </svg>
  `;

  const finalImage = await sharp({
    create: {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([
      { input: processedAvatar, left: 0, top: 0 },
      { input: overlayBuffer, left: 0, top: 0 },
      { input: Buffer.from(textSvg), left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  return finalImage;
}

/**
 * I don't want to cast to any so this file exists to provide minimal type
 */
declare module 'gif-encoder-2' {
  import { Readable } from 'stream';
  import type { CanvasRenderingContext2D } from '@napi-rs/canvas';

  export default class GIFEncoder {
    constructor(width: number, height: number, algorithm?: string, useOptimizer?: boolean, totalFrames?: number);
    createReadStream(): Readable;
    start(): void;
    addFrame(ctx: CanvasRenderingContext2D): void;
    setDelay(ms: number): void;
    setQuality(quality: number): void;
    setRepeat(repeat: number): void;
    finish(): void;
    on(event: string, listener: (...args: any[]) => void): this;
    out: Readable & { getData?: () => Buffer };
  }
}

/**
 * Canvas 2D static rendering module for Minecraft skins.
 *
 * Provides functions to render various 2D views of Minecraft player skins
 * using the Canvas 2D API. No WebGL/WebGPU required.
 *
 * @example Browser usage
 * ```ts
 * import { renderAvatar, renderSkinFront } from '@daidr/minecraft-skin-renderer/canvas2d'
 *
 * const canvas = document.getElementById('canvas') as HTMLCanvasElement
 * await renderAvatar(canvas, { skin: 'https://example.com/skin.png' })
 * ```
 *
 * @example Node.js usage
 * ```ts
 * import { createCanvas, loadImage } from '@napi-rs/canvas'
 * import { setCreateCanvas, renderAvatar } from '@daidr/minecraft-skin-renderer/canvas2d'
 *
 * setCreateCanvas((w, h) => createCanvas(w, h) as any)
 * const canvas = createCanvas(1, 1)
 * await renderAvatar(canvas as any, { skin: await loadImage('skin.png') })
 * ```
 */

export { renderAvatar } from "./renderers/avatar";
export { renderSkinFront } from "./renderers/front";
export { renderSkinBack } from "./renderers/back";
export { renderSkinSide } from "./renderers/side";
export { renderSkinIsometric } from "./renderers/isometric";
export { renderHalfBody } from "./renderers/half-body";
export { renderBigHead } from "./renderers/big-head";

export { setCreateCanvas } from "./canvas-env";
export { drawToCanvas } from "./draw-to-canvas";

export type {
  TextureSource,
  IImage,
  ModelVariant,
  BaseRenderOptions,
  AvatarOptions,
  SkinViewOptions,
  IsometricOptions,
  HalfBodyOptions,
  BigHeadOptions,
} from "./types";

export type { ICanvas, ICanvasRenderingContext2D, IImageData } from "./canvas-env";

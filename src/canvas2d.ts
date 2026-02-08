/**
 * Canvas 2D static rendering module for minecraft-skin-renderer.
 *
 * This module provides lightweight 2D rendering functions for Minecraft player skins
 * using the Canvas 2D API. It supports rendering avatars, front/back/side views,
 * isometric (2.5D) views, half-body portraits, and big head (Q-version) styles.
 *
 * @example Browser usage
 * ```ts
 * import { renderAvatar } from '@daidr/minecraft-skin-renderer/canvas2d'
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
 *
 * @module
 */

export {
  renderAvatar,
  renderSkinFront,
  renderSkinBack,
  renderSkinSide,
  renderSkinIsometric,
  renderHalfBody,
  renderBigHead,
  setCreateCanvas,
  drawToCanvas,
} from "./canvas2d/index";

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
  ICanvas,
  ICanvasRenderingContext2D,
  IImageData,
} from "./canvas2d/index";

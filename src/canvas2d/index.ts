/**
 * Canvas 2D static rendering module for Minecraft skins.
 *
 * Provides functions to render various 2D views of Minecraft player skins
 * using the Canvas 2D API. No WebGL/WebGPU required.
 *
 * @example
 * ```ts
 * import {
 *   renderAvatar,
 *   renderSkinFront,
 *   renderSkinIsometric,
 *   renderBigHead,
 * } from '@daidr/minecraft-skin-renderer/canvas2d'
 *
 * const canvas = document.getElementById('canvas') as HTMLCanvasElement
 *
 * // Render a head avatar
 * await renderAvatar(canvas, { skin: 'https://example.com/skin.png' })
 *
 * // Render full body front view
 * await renderSkinFront(canvas, { skin: 'https://example.com/skin.png', scale: 10 })
 *
 * // Render 2.5D isometric view
 * await renderSkinIsometric(canvas, { skin: skinBlob, slim: true })
 *
 * // Render big head (Q-version) style
 * await renderBigHead(canvas, {
 *   skin: 'https://example.com/skin.png',
 *   showBackground: true,
 *   backgroundStripes: 24,
 * })
 * ```
 */

export { renderAvatar } from "./renderers/avatar";
export { renderSkinFront } from "./renderers/front";
export { renderSkinBack } from "./renderers/back";
export { renderSkinSide } from "./renderers/side";
export { renderSkinIsometric } from "./renderers/isometric";
export { renderHalfBody } from "./renderers/half-body";
export { renderBigHead } from "./renderers/big-head";

export type {
  TextureSource,
  ModelVariant,
  BaseRenderOptions,
  AvatarOptions,
  SkinViewOptions,
  IsometricOptions,
  HalfBodyOptions,
  BigHeadOptions,
} from "./types";

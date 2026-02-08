/**
 * Canvas 2D static rendering module for minecraft-skin-renderer.
 *
 * This module provides lightweight 2D rendering functions for Minecraft player skins
 * using the Canvas 2D API. It supports rendering avatars, front/back/side views,
 * isometric (2.5D) views, half-body portraits, and big head (Q-version) styles.
 *
 * @example
 * ```ts
 * import { renderAvatar, renderBigHead } from '@daidr/minecraft-skin-renderer/canvas2d'
 *
 * const canvas = document.getElementById('canvas') as HTMLCanvasElement
 * await renderAvatar(canvas, { skin: 'https://example.com/skin.png' })
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
} from "./canvas2d/index";

export type {
  TextureSource,
  ModelVariant,
  BaseRenderOptions,
  AvatarOptions,
  SkinViewOptions,
  IsometricOptions,
  HalfBodyOptions,
  BigHeadOptions,
} from "./canvas2d/index";

export type TextureSource = string | File | Blob | null;

export interface PlaygroundSettings {
  mode: PlaygroundMode;
  backend: string;
  slimModel: boolean;
  animation: string;
  animationSpeed: number;
  animationAmplitude: number;
  backEquipment: string;
  zoom: number;
  autoRotate: boolean;
  partsVisibility: Record<string, { inner: boolean; outer: boolean }>;
  panoramaUrl: string;
}

export type PlaygroundMode = "3d" | "2d";

export type RenderType =
  | "avatar"
  | "front"
  | "back"
  | "side"
  | "isometric"
  | "halfBody"
  | "bigHead";

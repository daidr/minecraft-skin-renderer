import type { PartsVisibility } from "@daidr/minecraft-skin-renderer";

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
  rotationTheta: number; // horizontal angle in degrees (-180..180)
  rotationPhi: number; // vertical angle in degrees (10..170)
  autoRotate: boolean;
  partsVisibility: PartsVisibility;
  panoramaUrl: string;
}

export type PlaygroundMode = "3d" | "2d";

export type RenderType =
  | "avatar"
  | "front"
  | "back"
  | "rightSide"
  | "leftSide"
  | "isometric"
  | "halfBody"
  | "bigHead";

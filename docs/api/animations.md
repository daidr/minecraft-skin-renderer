# 动画

Minecraft Skin Renderer 内置了基于关键帧的动画系统，支持预设动画和自定义动画。

## 基本用法

通过 `SkinViewer` 实例控制动画播放：

```ts
const viewer = await createSkinViewer({ canvas, skin: "..." });
viewer.startRenderLoop();

// 播放动画
viewer.playAnimation("walk");

// 使用配置
viewer.playAnimation("run", { speed: 1.5, amplitude: 0.8 });

// 控制播放
viewer.pauseAnimation();
viewer.resumeAnimation();
viewer.stopAnimation();
```

::: tip 360° 持续旋转
模型的自动旋转不属于动画系统，而是通过相机的轨道控制实现的。可以在创建时或运行时启用：

```ts
// 创建时启用
const viewer = await createSkinViewer({
  canvas,
  skin: "...",
  autoRotate: true,
  autoRotateSpeed: 30, // 度/秒
});

// 运行时切换
viewer.setAutoRotate(true);
```

自动旋转可以与骨骼动画同时使用，例如一边播放行走动画一边旋转展示模型。
:::

## 预设动画

导入主模块时自动注册以下预设动画：

| 名称 | 时长 | 循环 | 说明 |
| --- | --- | --- | --- |
| `"idle"` | 3.0s | 是 | 空闲待机，细微的呼吸/摇摆动作 |
| `"walk"` | 1.2s | 是 | 行走，手臂摆动 24°，腿部摆动 40° |
| `"run"` | 0.5s | 是 | 奔跑，增强的上下弹跳，手臂 70°，腿部 60° |
| `"fly"` | 1.5s | 是 | 飞行姿态，身体前倾 80°，鞘翅展开 |

## AnimationConfig

播放动画时的可选配置：

```ts
interface AnimationConfig {
  speed?: number;     // 播放速度倍率，默认 1.0
  amplitude?: number; // 动作幅度倍率，默认 1.0
}
```

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `speed` | `number` | `1.0` | 播放速度倍率。2.0 = 双倍速，0.5 = 半速 |
| `amplitude` | `number` | `1.0` | 动作幅度倍率。增大使动作更夸张，减小使动作更细微 |

## 自定义动画

### 注册动画

使用 `registerAnimation()` 注册自定义动画：

```ts
import { registerAnimation } from "@daidr/minecraft-skin-renderer";
```

```ts
function registerAnimation(animation: Animation): void
```

### 获取动画

```ts
import { getAnimation } from "@daidr/minecraft-skin-renderer";
```

```ts
function getAnimation(name: string): Animation | undefined
```

### Animation

动画定义：

```ts
interface Animation {
  name: string;           // 动画名称（用于 playAnimation）
  duration: number;       // 动画时长（秒）
  loop: boolean;          // 是否循环播放
  tracks: AnimationTrack[]; // 骨骼动画轨道数组
}
```

### AnimationTrack

单个骨骼的动画轨道：

```ts
interface AnimationTrack {
  boneIndex: BoneIndex;   // 目标骨骼索引
  keyframes: Keyframe[];  // 关键帧数组
}
```

### Keyframe

关键帧定义：

```ts
interface Keyframe {
  time: number;                // 归一化时间（0–1）
  rotation?: Quat;             // 目标旋转（可选）
  position?: Vec3;             // 目标位置偏移（可选）
  easing?: EasingFunction;     // 缓动函数（可选）
}
```

- `time`：在动画周期内的时间位置，0 表示起始，1 表示结束
- `rotation`：四元数 `[x, y, z, w]`，使用球面线性插值（SLERP）
- `position`：位置偏移 `[x, y, z]`，使用线性插值（LERP）
- `easing`：自定义缓动函数，签名 `(t: number) => number`

### 完整示例

```ts
import { registerAnimation } from "@daidr/minecraft-skin-renderer";
import { BoneIndex } from "@daidr/minecraft-skin-renderer"; // 通过 math 模块导出

registerAnimation({
  name: "nod",
  duration: 1.0,
  loop: true,
  tracks: [
    {
      boneIndex: BoneIndex.Head,
      keyframes: [
        { time: 0, rotation: [0, 0, 0, 1] },
        { time: 0.5, rotation: [-0.087, 0, 0, 0.996] }, // 点头 ~10°
        { time: 1, rotation: [0, 0, 0, 1] },
      ],
    },
  ],
});

// 使用
viewer.playAnimation("nod");
```

## BoneIndex

骨骼索引枚举，用于动画轨道中指定目标骨骼：

```ts
enum BoneIndex {
  Root = 0,           // 根节点
  Head = 1,           // 头部
  Body = 2,           // 身体
  LeftArm = 3,        // 左臂
  RightArm = 4,       // 右臂
  LeftLeg = 5,        // 左腿
  RightLeg = 6,       // 右腿
  HeadOverlay = 7,    // 头部外层
  BodyOverlay = 8,    // 身体外层
  LeftArmOverlay = 9, // 左臂外层
  RightArmOverlay = 10, // 右臂外层
  LeftLegOverlay = 11,  // 左腿外层
  RightLegOverlay = 12, // 右腿外层
  Cape = 13,          // 披风
  LeftWing = 14,      // 左鞘翅
  RightWing = 15,     // 右鞘翅
}
```

**骨骼层级关系：**

```
Root
└── Body
    ├── Head（及 HeadOverlay）
    ├── LeftArm（及 LeftArmOverlay）
    ├── RightArm（及 RightArmOverlay）
    ├── LeftLeg（及 LeftLegOverlay）
    ├── RightLeg（及 RightLegOverlay）
    ├── Cape
    ├── LeftWing
    └── RightWing
```

## AnimationController

动画控制器接口（高级用法，通常通过 `SkinViewer` 方法间接使用）：

```ts
interface AnimationController {
  readonly isPlaying: boolean;
  readonly isPaused: boolean;
  readonly currentAnimation: string | null;
  readonly progress: number; // 0–1 当前播放进度

  play(name: string, config?: AnimationConfig): void;
  pause(): void;
  resume(): void;
  stop(): void;
}
```

### AnimationPlayState

```ts
enum AnimationPlayState {
  Stopped = 0,
  Playing = 1,
  Paused = 2,
}
```

## 缓动函数

内置缓动函数，可用于关键帧的 `easing` 属性：

```ts
// 从动画模块导入（高级用法）
import {
  linear,
  easeInQuad, easeOutQuad, easeInOutQuad,
  easeInCubic, easeOutCubic, easeInOutCubic,
  easeInSine, easeOutSine, easeInOutSine,
  sineWave,
  halfSine,
  bounce,
  elastic,
} from "@daidr/minecraft-skin-renderer";
```

| 函数 | 说明 |
| --- | --- |
| `linear` | 线性（无缓动） |
| `easeInQuad` | 二次方缓入 |
| `easeOutQuad` | 二次方缓出 |
| `easeInOutQuad` | 二次方缓入缓出 |
| `easeInCubic` | 三次方缓入 |
| `easeOutCubic` | 三次方缓出 |
| `easeInOutCubic` | 三次方缓入缓出 |
| `easeInSine` | 正弦缓入 |
| `easeOutSine` | 正弦缓出 |
| `easeInOutSine` | 正弦缓入缓出 |
| `sineWave` | 完整正弦波振荡（适用于循环动画） |
| `halfSine` | 半正弦波（0→1→0） |
| `bounce` | 弹跳效果 |
| `elastic` | 弹性效果 |

所有缓动函数签名均为 `(t: number) => number`，其中 `t` 为归一化时间（0–1）。

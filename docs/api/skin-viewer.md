# SkinViewer

`SkinViewer` 是 3D 皮肤渲染的核心 API，提供皮肤模型的创建、控制和交互。

## use()

注册插件到全局注册表。必须在 `createSkinViewer()` 之前调用。

```ts
import { use } from "@daidr/minecraft-skin-renderer";
import { WebGLRendererPlugin } from "@daidr/minecraft-skin-renderer/webgl";

use(WebGLRendererPlugin);
```

**参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `plugin` | `RendererPlugin \| FeaturePlugin` | 渲染器插件或功能插件 |

## createSkinViewer()

创建一个新的皮肤查看器实例。

```ts
import { createSkinViewer } from "@daidr/minecraft-skin-renderer";

const viewer = await createSkinViewer(options);
```

**返回值：** `Promise<SkinViewer>`

### SkinViewerOptions

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `canvas` | `HTMLCanvasElement` | *必填* | 渲染目标画布元素 |
| `skin` | `TextureSource` | — | 皮肤纹理（URL、Blob 或图像对象） |
| `cape` | `TextureSource` | — | 披风纹理（64x32 格式），同时用于鞘翅 |
| `slim` | `boolean` | `false` | 是否使用纤细模型（3px 手臂） |
| `backEquipment` | `BackEquipment` | `"none"` | 背部装备：`"cape"` / `"elytra"` / `"none"`。提供 cape 纹理时默认为 `"cape"` |
| `preferredBackend` | `BackendType \| "auto"` | `"auto"` | 渲染后端：`"webgl"` / `"webgpu"` / `"auto"` |
| `antialias` | `boolean` | `true` | 是否启用抗锯齿 |
| `pixelRatio` | `number` | — | DPI 缩放系数 |
| `fov` | `number` | `70` | 视场角（度） |
| `zoom` | `number` | — | 初始缩放距离 |
| `enableRotate` | `boolean` | `true` | 允许鼠标旋转 |
| `enableZoom` | `boolean` | `true` | 允许鼠标缩放 |
| `autoRotate` | `boolean` | `false` | 自动旋转模型 |
| `autoRotateSpeed` | `number` | `30` | 自动旋转速度（度/秒） |
| `panorama` | `TextureSource` | — | 全景图背景（需注册 PanoramaPlugin） |

## SkinViewer 实例

### 纹理管理

#### setSkin()

设置皮肤纹理。

```ts
await viewer.setSkin("https://example.com/skin.png");
await viewer.setSkin(null); // 清除皮肤
```

**参数：** `source: TextureSource | null`

#### setCape()

设置披风纹理（64x32 格式），同时用于披风和鞘翅。设置后若 `backEquipment` 为 `"none"` 会自动切换为 `"cape"`；传入 `null` 时会将 `backEquipment` 设为 `"none"`。

```ts
await viewer.setCape("https://example.com/cape.png");
```

**参数：** `source: TextureSource | null`

#### setSlim()

切换纤细/经典模型。会重建骨架和几何体，并保留当前动画状态。

```ts
viewer.setSlim(true); // 纤细模型（3px 手臂）
viewer.setSlim(false); // 经典模型（4px 手臂）
```

**参数：** `slim: boolean`

### 装备控制

#### setBackEquipment()

设置背部装备显示。

```ts
viewer.setBackEquipment("cape");
viewer.setBackEquipment("elytra");
viewer.setBackEquipment("none");
```

**参数：** `equipment: BackEquipment` — `"cape"` | `"elytra"` | `"none"`

#### backEquipment <Badge type="info" text="只读" />

获取当前背部装备设置。

```ts
const equipment = viewer.backEquipment; // "cape" | "elytra" | "none"
```

### 部位可见性

#### getPartsVisibility()

获取所有部位的可见性设置（返回深拷贝）。

```ts
const visibility = viewer.getPartsVisibility();
// { head: { inner: true, outer: true }, body: { ... }, ... }
```

**返回值：** `PartsVisibility`

#### setPartsVisibility()

批量设置所有部位可见性。

```ts
viewer.setPartsVisibility({
  head: { inner: true, outer: true },
  body: { inner: true, outer: false },
  leftArm: { inner: true, outer: true },
  rightArm: { inner: true, outer: true },
  leftLeg: { inner: true, outer: true },
  rightLeg: { inner: true, outer: true },
});
```

**参数：** `visibility: PartsVisibility`

#### setPartVisibility()

设置单个部位的可见性。

```ts
viewer.setPartVisibility("head", "outer", false); // 隐藏头部外层
viewer.setPartVisibility("body", "both", true); // 显示身体所有层
```

**参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `part` | `PartName` | 部位名：`"head"` / `"body"` / `"leftArm"` / `"rightArm"` / `"leftLeg"` / `"rightLeg"` |
| `layer` | `"inner" \| "outer" \| "both"` | 目标层 |
| `visible` | `boolean` | 是否可见 |

### 动画控制

#### playAnimation()

播放指定名称的动画。

```ts
viewer.playAnimation("walk");
viewer.playAnimation("run", { speed: 1.5, amplitude: 0.8 });
```

**参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 动画名称 |
| `config` | `AnimationConfig` | 可选播放配置 |

#### pauseAnimation()

暂停当前动画。

```ts
viewer.pauseAnimation();
```

#### resumeAnimation()

恢复暂停的动画。

```ts
viewer.resumeAnimation();
```

#### stopAnimation()

停止动画并重置骨架姿态。

```ts
viewer.stopAnimation();
```

#### isPlaying <Badge type="info" text="只读" />

动画是否正在播放。

```ts
if (viewer.isPlaying) { /* ... */ }
```

#### currentAnimation <Badge type="info" text="只读" />

当前播放的动画名称，未播放时为 `null`。

```ts
const name = viewer.currentAnimation; // string | null
```

### 相机控制

#### setRotation()

设置轨道控制器的旋转角度。

```ts
viewer.setRotation(theta, phi);
```

**参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `theta` | `number` | 水平角度（弧度） |
| `phi` | `number` | 垂直角度（弧度） |

#### getRotation()

获取当前旋转角度。

```ts
const { theta, phi } = viewer.getRotation();
```

**返回值：** `{ theta: number; phi: number }`

#### setZoom()

设置缩放距离。

```ts
viewer.setZoom(60);
```

**参数：** `zoom: number` — 相机到目标的距离（范围 20–150）

#### getZoom()

获取当前缩放距离。

```ts
const distance = viewer.getZoom();
```

**返回值：** `number`

#### setAutoRotate()

启用或禁用自动旋转。

```ts
viewer.setAutoRotate(true);
```

**参数：** `enabled: boolean`

#### resetCamera()

重置相机到初始位置。

```ts
viewer.resetCamera();
```

### 渲染控制

#### render()

手动触发一帧渲染。

```ts
viewer.render();
```

#### startRenderLoop()

启动 requestAnimationFrame 渲染循环。

```ts
viewer.startRenderLoop();
```

#### stopRenderLoop()

停止渲染循环。

```ts
viewer.stopRenderLoop();
```

#### resize()

调整渲染尺寸。

```ts
viewer.resize(800, 600);
```

**参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `width` | `number` | 宽度（像素） |
| `height` | `number` | 高度（像素） |

#### screenshot()

截图并返回 Data URL。

```ts
const dataUrl = viewer.screenshot(); // PNG
const jpegUrl = viewer.screenshot("jpeg", 0.8); // JPEG, 80% 质量
```

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | `"png" \| "jpeg"` | `"png"` | 图像格式 |
| `quality` | `number` | `0.92` | JPEG 质量（0–1） |

**返回值：** `string` — Data URL

### 背景

#### setPanorama()

设置全景图背景。需要先注册 `PanoramaPlugin`。

```ts
import { PanoramaPlugin } from "@daidr/minecraft-skin-renderer/panorama";
use(PanoramaPlugin);

await viewer.setPanorama("https://example.com/panorama.jpg");
await viewer.setPanorama(null); // 清除背景
```

**参数：** `source: TextureSource | null`

### 状态查询

#### backend <Badge type="info" text="只读" />

当前使用的渲染后端。

```ts
const backend = viewer.backend; // "webgl" | "webgpu"
```

### 生命周期

#### dispose()

销毁 viewer，释放所有 GPU 资源。销毁后不应再调用任何方法。

```ts
viewer.dispose();
```

## 类型定义

### TextureSource

```ts
type TextureSource = string | Blob | HTMLImageElement | ImageBitmap;
```

### BackEquipment

```ts
type BackEquipment = "cape" | "elytra" | "none";
```

### BackendType

```ts
type BackendType = "webgl" | "webgpu";
```

### ModelVariant

```ts
type ModelVariant = "classic" | "slim";
```

### PartName

```ts
type PartName = "head" | "body" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";
```

### LayerVisibility

```ts
interface LayerVisibility {
  inner: boolean;
  outer: boolean;
}
```

### PartsVisibility

```ts
interface PartsVisibility {
  head: LayerVisibility;
  body: LayerVisibility;
  leftArm: LayerVisibility;
  rightArm: LayerVisibility;
  leftLeg: LayerVisibility;
  rightLeg: LayerVisibility;
}
```

### AnimationConfig

```ts
interface AnimationConfig {
  speed?: number;     // 播放速度倍率，默认 1.0
  amplitude?: number; // 动作幅度倍率，默认 1.0
}
```

## 工具函数

### 后端检测

```ts
import {
  isWebGPUSupported,
  isWebGL2Supported,
  detectBestBackend,
} from "@daidr/minecraft-skin-renderer";

isWebGPUSupported();    // boolean
isWebGL2Supported();    // boolean
detectBestBackend();    // "webgpu" | "webgl" | null
```

### 纹理加载

```ts
import {
  loadSkinTexture,
  loadCapeTexture,
  loadElytraTexture,
} from "@daidr/minecraft-skin-renderer";

const skin = await loadSkinTexture(source);   // 自动处理旧版 64x32 格式
const cape = await loadCapeTexture(source);
const elytra = await loadElytraTexture(source);
```

### 可见性辅助

```ts
import {
  createDefaultVisibility,
  PART_NAMES,
} from "@daidr/minecraft-skin-renderer";

const visibility = createDefaultVisibility(); // 所有部位全部可见
PART_NAMES; // ["head", "body", "leftArm", "rightArm", "leftLeg", "rightLeg"]
```

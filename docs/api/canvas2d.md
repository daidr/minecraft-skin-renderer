# Canvas2D

Canvas2D 模块提供无需 WebGL 的 2D 静态皮肤渲染功能，支持浏览器和 Node.js 环境。

## 导入

```ts
import {
  renderAvatar,
  renderSkinFront,
  renderSkinBack,
  renderSkinSide,
  renderSkinIsometric,
  renderHalfBody,
  renderBigHead,
  setCreateCanvas,
  drawToCanvas,
} from "@daidr/minecraft-skin-renderer/canvas2d";
```

## 渲染函数

所有渲染函数均为异步函数，接受一个画布对象和选项对象作为参数。函数会自动调整画布尺寸并渲染到画布上。所有函数均支持 classic（4px 手臂）和 slim（3px 手臂）两种皮肤变体。

### renderAvatar()

渲染玩家头部正面。

```ts
async function renderAvatar(canvas: ICanvas, options: AvatarOptions): Promise<void>
```

**输出尺寸：** `8 × scale` px（启用 `overlayInflated` 时会额外增加边距）

```ts
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
await renderAvatar(canvas, {
  skin: "https://example.com/skin.png",
  scale: 8,
});
```

### renderSkinFront()

渲染玩家全身正面视图。

```ts
async function renderSkinFront(canvas: ICanvas, options: SkinViewOptions): Promise<void>
```

**输出尺寸：**
- 经典模型：`16 × scale` × `32 × scale` px
- 纤细模型：`14 × scale` × `32 × scale` px

### renderSkinBack()

渲染玩家全身背面视图（正面的镜像）。

```ts
async function renderSkinBack(canvas: ICanvas, options: SkinViewOptions): Promise<void>
```

**输出尺寸：** 与 `renderSkinFront` 相同

### renderSkinSide()

渲染玩家右侧视图。

```ts
async function renderSkinSide(canvas: ICanvas, options: SkinViewOptions): Promise<void>
```

**输出尺寸：** `8 × scale` × `32 × scale` px

### renderSkinIsometric()

渲染等距（2.5D）投影视图，展示正面和左侧面。

```ts
async function renderSkinIsometric(canvas: ICanvas, options: IsometricOptions): Promise<void>
```

深度方向向右上方延伸，深度比率为 0.5。使用画布变换实现等距投影效果。

### renderHalfBody()

渲染上半身（头部 + 身体 + 手臂，不含腿部）。

```ts
async function renderHalfBody(canvas: ICanvas, options: HalfBodyOptions): Promise<void>
```

**输出尺寸：**
- 经典模型：`16 × scale` × `20 × scale` px
- 纤细模型：`14 × scale` × `20 × scale` px

### renderBigHead()

渲染 Q 版大头像风格角色。头部保持原始细节，身体各部位使用主色块简化处理。

```ts
async function renderBigHead(canvas: ICanvas, options: BigHeadOptions): Promise<void>
```

**角色比例：**
- 头部：16×16 像素（保持原始细节）
- 躯干：4×6 像素（主色块填充）
- 手臂：每只 2×4 像素
- 腿部：每只 2×2 像素

```ts
await renderBigHead(canvas, {
  skin: skinImage,
  scale: 20,
  border: 2,
  borderColor: "black",
});
```

## 选项类型

### BaseRenderOptions

所有渲染函数共用的基础选项：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `skin` | `TextureSource` | *必填* | 皮肤纹理源 |
| `slim` | `boolean` | `false` | 使用纤细模型（3px 手臂） |
| `showOverlay` | `boolean` | `true` | 显示外层覆盖层 |
| `scale` | `number` | `8` | 像素缩放因子（1 MC 像素 = scale 屏幕像素） |
| `overlayInflated` | `boolean` | `false` | 外层是否略微膨胀（类似 3D 渲染器效果） |

### AvatarOptions

继承 `BaseRenderOptions`，无额外属性。

### SkinViewOptions

继承 `BaseRenderOptions`，无额外属性。用于 `renderSkinFront`、`renderSkinBack`、`renderSkinSide`。

### IsometricOptions

继承 `BaseRenderOptions`，无额外属性。

### HalfBodyOptions

继承 `BaseRenderOptions`，无额外属性。

### BigHeadOptions

继承 `BaseRenderOptions`，额外属性：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `border` | `number` | `2` | 每个身体部位周围的边框宽度（虚拟像素） |
| `borderColor` | `string` | `"black"` | 边框颜色（CSS 颜色值） |

## TextureSource

Canvas2D 模块的纹理源类型与主模块不同，支持更广泛的输入：

```ts
type TextureSource = IImageData | IImage | string | Blob;
```

| 类型 | 环境 | 说明 |
| --- | --- | --- |
| `IImageData` | 通用 | 像素数据对象（`{ width, height, data: Uint8ClampedArray }`） |
| `IImage` | 通用 | 任何具有 `width`/`height` 属性的可绘制图像对象 |
| `string` | 仅浏览器 | 图像 URL |
| `Blob` | 仅浏览器 | 二进制图像数据 |

## 环境配置

### setCreateCanvas()

为 Node.js 环境设置画布工厂函数。**必须在调用任何渲染函数之前调用。**

```ts
function setCreateCanvas(fn: (width: number, height: number) => ICanvas): void
```

浏览器环境会自动使用 `document.createElement("canvas")`，无需调用此函数。

```ts
// Node.js 示例（使用 @napi-rs/canvas）
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { setCreateCanvas, renderAvatar } from "@daidr/minecraft-skin-renderer/canvas2d";

setCreateCanvas((w, h) => createCanvas(w, h) as any);

const canvas = createCanvas(1, 1);
const skinImage = await loadImage("skin.png");
await renderAvatar(canvas as any, { skin: skinImage });
```

### drawToCanvas()

将 `IImageData` 绘制到 `HTMLCanvasElement` 上的辅助函数。

```ts
function drawToCanvas(canvas: HTMLCanvasElement, data: IImageData): void
```

会自动调整画布尺寸以匹配图像数据的尺寸。

## 环境接口

以下接口使得 Canvas2D 模块可以在浏览器和 Node.js 环境中通用。

### ICanvas

```ts
interface ICanvas {
  width: number;
  height: number;
  getContext(contextId: "2d"): ICanvasRenderingContext2D | null;
}
```

### IImageData

```ts
interface IImageData {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}
```

### IImage

```ts
interface IImage {
  readonly width: number;
  readonly height: number;
}
```

## 皮肤格式支持

- **标准皮肤：** 64×64 像素
- **高清皮肤：** 128×128、256×256 等（自动检测缩放比例）
- **旧版格式：** 64×32（自动转换为 64×64）

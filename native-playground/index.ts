import {
  setCreateCanvas,
  renderAvatar,
  renderBigHead,
  renderSkinFront,
  renderSkinBack,
  renderSkinRightSide,
  renderSkinLeftSide,
  renderSkinIsometric,
} from "@daidr/minecraft-skin-renderer/canvas2d";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "node:fs/promises";

await fs.mkdir("./result", { recursive: true });

setCreateCanvas((w, h) => createCanvas(w, h));

const skin = await loadImage("../playground/public/skin.png");

{
  const canvas = createCanvas(1, 1);

  await renderAvatar(canvas, {
    skin,
    slim: false,
    showOverlay: true,
    scale: 10,
    overlayInflated: true,
  });

  console.log(`Rendered Avatar: ${canvas.width}x${canvas.height}`);
  await fs.writeFile("./result/avatar.png", canvas.toBuffer("image/png"));
}

{
  const canvas = createCanvas(1, 1);

  await renderBigHead(canvas, {
    skin,
    slim: false,
    showOverlay: true,
    scale: 10,
    overlayInflated: false,
  });

  console.log(`Rendered BigHead: ${canvas.width}x${canvas.height}`);
  await fs.writeFile("./result/bighead.png", canvas.toBuffer("image/png"));
}

{
  const canvas = createCanvas(1, 1);

  await renderSkinFront(canvas, {
    skin,
    slim: false,
    showOverlay: true,
    scale: 10,
    overlayInflated: true,
  });

  console.log(`Rendered SkinFront: ${canvas.width}x${canvas.height}`);
  await fs.writeFile("./result/skinfront.png", canvas.toBuffer("image/png"));
}

{
  const canvas = createCanvas(1, 1);

  await renderSkinBack(canvas, {
    skin,
    slim: false,
    showOverlay: true,
    scale: 10,
    overlayInflated: true,
  });

  console.log(`Rendered SkinBack: ${canvas.width}x${canvas.height}`);
  await fs.writeFile("./result/skinback.png", canvas.toBuffer("image/png"));
}

{
  const canvas = createCanvas(1, 1);

  await renderSkinRightSide(canvas, {
    skin,
    slim: false,
    showOverlay: true,
    scale: 10,
    overlayInflated: true,
  });

  console.log(`Rendered SkinRightSide: ${canvas.width}x${canvas.height}`);
  await fs.writeFile("./result/skinrightside.png", canvas.toBuffer("image/png"));
}

{
  const canvas = createCanvas(1, 1);

  await renderSkinLeftSide(canvas, {
    skin,
    slim: false,
    showOverlay: true,
    scale: 10,
    overlayInflated: true,
  });

  console.log(`Rendered SkinLeftSide: ${canvas.width}x${canvas.height}`);
  await fs.writeFile("./result/skinleftside.png", canvas.toBuffer("image/png"));
}

{
  const canvas = createCanvas(1, 1);

  await renderSkinIsometric(canvas, {
    skin,
    slim: false,
    showOverlay: true,
    scale: 10,
    overlayInflated: true,
  });

  console.log(`Rendered SkinIsometric: ${canvas.width}x${canvas.height}`);
  await fs.writeFile("./result/skinisometric.png", canvas.toBuffer("image/png"));
}

import Phaser from "phaser";
import { getPlaceholderAsset, type PlaceholderShape } from "../data/assets";

export function createAssetIcon(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  assetKey: string,
  labelOverride?: string
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);

  if (scene.textures.exists(assetKey)) {
    const image = scene.add.image(0, 0, assetKey);
    const frame = image.getBounds();
    const maxSide = Math.max(frame.width, frame.height, 1);
    image.setScale(size / maxSide);
    container.add(image);
    return container;
  }

  const spec = getPlaceholderAsset(assetKey);
  const shape = createPlaceholderShape(scene, size, spec.shape, spec.color, spec.accent);
  const text = scene.add.text(0, 0, labelOverride ?? spec.label, {
    fontFamily: "sans-serif",
    fontSize: `${Math.max(10, Math.floor(size * 0.38))}px`,
    color: "#fff4df",
    fontStyle: "700",
    align: "center"
  }).setOrigin(0.5);

  container.add([shape, text]);
  return container;
}

function createPlaceholderShape(
  scene: Phaser.Scene,
  size: number,
  shape: PlaceholderShape,
  color: number,
  accent: number
): Phaser.GameObjects.GameObject {
  const half = size / 2;
  if (shape === "circle") {
    return scene.add.circle(0, 0, half, color, 1).setStrokeStyle(2, accent, 0.85);
  }
  if (shape === "diamond") {
    return scene.add.polygon(0, 0, [0, -half, half, 0, 0, half, -half, 0], color, 1)
      .setStrokeStyle(2, accent, 0.85);
  }
  if (shape === "star") {
    return scene.add.star(0, 0, 5, half * 0.52, half, color, 1).setStrokeStyle(2, accent, 0.85);
  }
  if (shape === "badge") {
    return scene.add.rectangle(0, 0, size, size * 0.82, color, 1).setStrokeStyle(2, accent, 0.85);
  }
  return scene.add.rectangle(0, 0, size, size, color, 1).setStrokeStyle(2, accent, 0.85);
}

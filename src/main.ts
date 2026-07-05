import Phaser from "phaser";
import "../styles.css";
import { BaseScene } from "./game/scenes/BaseScene";
import { BootScene } from "./game/scenes/BootScene";
import { DungeonScene } from "./game/scenes/DungeonScene";
import { ResultScene } from "./game/scenes/ResultScene";
import { TitleScene } from "./game/scenes/TitleScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#14141c",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 }
    }
  },
  input: {
    activePointers: 4
  },
  scene: [BootScene, TitleScene, BaseScene, DungeonScene, ResultScene]
};

new Phaser.Game(config);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // PWA support is best-effort; the game must still run without it.
    });
  });
}

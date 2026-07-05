import type { ItemId } from "../data/items";

export type SaveData = {
  version: "0.1.0";
  player: {
    money: number;
    broomLevel: number;
    bagLevel: number;
    attackLevel: number;
    staminaLevel: number;
    craftedBroom: boolean;
    craftedWeapon: boolean;
  };
  inventory: Record<ItemId, number>;
  progress: {
    unlockedDungeons: string[];
    lastPlayedAt: string;
    runs: number;
  };
  settings: {
    bgmVolume: number;
    seVolume: number;
    controlType: "touch";
    controlLayout: "leftStickRightButtons" | "rightStickLeftButtons";
  };
};

const STORAGE_KEY = "chacha-save-v1";

export function createDefaultSave(): SaveData {
  return {
    version: "0.1.0",
    player: {
      money: 0,
      broomLevel: 1,
      bagLevel: 1,
      attackLevel: 1,
      staminaLevel: 1,
      craftedBroom: false,
      craftedWeapon: false
    },
    inventory: {
      stone: 0,
      wood: 0,
      slime: 0,
      ash: 0,
      metal: 0
    },
    progress: {
      unlockedDungeons: ["beginner_cave"],
      lastPlayedAt: new Date().toISOString(),
      runs: 0
    },
    settings: {
      bgmVolume: 0.5,
      seVolume: 0.7,
      controlType: "touch",
      controlLayout: "leftStickRightButtons"
    }
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSave();

    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const fallback = createDefaultSave();

    return {
      version: "0.1.0",
      player: {
        money: Number(parsed.player?.money ?? fallback.player.money),
        broomLevel: Number(parsed.player?.broomLevel ?? fallback.player.broomLevel),
        bagLevel: Number(parsed.player?.bagLevel ?? fallback.player.bagLevel),
        attackLevel: Number(parsed.player?.attackLevel ?? fallback.player.attackLevel),
        staminaLevel: Number(parsed.player?.staminaLevel ?? fallback.player.staminaLevel),
        craftedBroom: Boolean(parsed.player?.craftedBroom ?? fallback.player.craftedBroom),
        craftedWeapon: Boolean(parsed.player?.craftedWeapon ?? fallback.player.craftedWeapon)
      },
      inventory: {
        stone: Number(parsed.inventory?.stone ?? 0),
        wood: Number(parsed.inventory?.wood ?? 0),
        slime: Number(parsed.inventory?.slime ?? 0),
        ash: Number(parsed.inventory?.ash ?? 0),
        metal: Number(parsed.inventory?.metal ?? 0)
      },
      progress: {
        unlockedDungeons: parsed.progress?.unlockedDungeons ?? fallback.progress.unlockedDungeons,
        lastPlayedAt: parsed.progress?.lastPlayedAt ?? fallback.progress.lastPlayedAt,
        runs: Number(parsed.progress?.runs ?? 0)
      },
      settings: {
        bgmVolume: Number(parsed.settings?.bgmVolume ?? fallback.settings.bgmVolume),
        seVolume: Number(parsed.settings?.seVolume ?? fallback.settings.seVolume),
        controlType: "touch",
        controlLayout:
          parsed.settings?.controlLayout === "rightStickLeftButtons"
            ? "rightStickLeftButtons"
            : "leftStickRightButtons"
      }
    };
  } catch {
    return createDefaultSave();
  }
}

export function saveGame(data: SaveData): void {
  const next = {
    ...data,
    progress: {
      ...data.progress,
      lastPlayedAt: new Date().toISOString()
    }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function resetSave(): SaveData {
  const data = createDefaultSave();
  saveGame(data);
  return data;
}

import { deflate, inflate } from "pako";

type BlueprintEntity = {
  entity_number?: number;
  name: string;
  position: { x: number; y: number };
  direction?: number;
};

type BlueprintIcon = { index: number; signal: { name: string; type?: string } };

type DecodedBlueprint = {
  blueprint?: { entities?: BlueprintEntity[]; tiles?: { name: string; position: { x: number; y: number } }[]; icons?: BlueprintIcon[] };
  blueprint_book?: { blueprints?: DecodedBlueprint[]; icons?: BlueprintIcon[] };
};

type PreviewMode = "sprites" | "schematic";

export type BlueprintPreviewHandle = {
  mode: PreviewMode;
  destroy: () => void;
  spriteError?: unknown;
};

type RenderBlueprintPreviewOptions = {
  useSprites?: boolean;
};

const TILE = 32;

function decodeBlueprintString(blueprintString: string): DecodedBlueprint {
  const source = blueprintString.trim();
  if (!source) throw new Error("Missing blueprint string.");
  if (!source.startsWith("0")) throw new Error("Unsupported blueprint string version.");

  const encoded = source.slice(1);
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  const json = inflate(bytes, { to: "string" });
  return JSON.parse(json) as DecodedBlueprint;
}

function encodeBlueprintString(decoded: DecodedBlueprint) {
  const bytes = deflate(JSON.stringify(decoded));
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return `0${btoa(binary)}`;
}

function placeholderIcon(index = 1): BlueprintIcon {
  return { index, signal: { name: "signal-unknown", type: "virtual" } };
}

function sanitizeIconsForSpriteRenderer(value: DecodedBlueprint) {
  // Book icons are decorative and optional in the vendored renderer schema.
  // They can reference newer/unknown signals, so remove them before validation.
  delete value.blueprint_book?.icons;

  // Blueprint icons are required by the vendored schema. They are not needed for
  // drawing entities, so normalize them to known virtual signals to avoid false
  // "modded blueprint" failures caused only by icon metadata.
  if (value.blueprint) {
    const icons = value.blueprint.icons?.length ? value.blueprint.icons : [placeholderIcon()];
    value.blueprint.icons = icons.slice(0, 4).map((icon, iconIndex) => placeholderIcon(icon.index || iconIndex + 1));
  }

  for (const entry of value.blueprint_book?.blueprints ?? []) {
    sanitizeIconsForSpriteRenderer(entry);
  }
}

function sanitizeBlueprintStringForSpriteRenderer(blueprintString: string) {
  const decoded = decodeBlueprintString(blueprintString);
  sanitizeIconsForSpriteRenderer(decoded);
  return encodeBlueprintString(decoded);
}

function selectBlueprint(decoded: DecodedBlueprint): NonNullable<DecodedBlueprint["blueprint"]> {
  if (decoded.blueprint) return decoded.blueprint;

  const bookBlueprint = decoded.blueprint_book?.blueprints?.find((entry) => entry.blueprint)?.blueprint;
  if (bookBlueprint) return bookBlueprint;

  throw new Error("No renderable blueprint found.");
}

function entitySize(name: string) {
  if (name.includes("beacon")) return { w: 3, h: 3 };
  if (name.includes("furnace") || name.includes("assembling-machine") || name.includes("chemical-plant")) return { w: 3, h: 3 };
  if (name.includes("lab") || name.includes("reactor") || name.includes("rocket-silo")) return { w: 4, h: 4 };
  if (name.includes("oil-refinery")) return { w: 5, h: 5 };
  if (name.includes("storage-tank")) return { w: 3, h: 3 };
  if (name.includes("splitter")) return { w: 2, h: 1 };
  if (name.includes("rail")) return { w: 2, h: 2 };
  if (name.includes("train-stop")) return { w: 2, h: 2 };
  if (name.includes("inserter") || name.includes("pole") || name.includes("pipe") || name.includes("belt")) return { w: 1, h: 1 };
  return { w: 1.4, h: 1.4 };
}

function entityColor(name: string) {
  if (name.includes("transport-belt") || name.includes("splitter") || name.includes("underground-belt")) return "#f0a12a";
  if (name.includes("inserter")) return "#d8c45f";
  if (name.includes("assembling-machine")) return "#4b9bd8";
  if (name.includes("furnace")) return "#bd7b3f";
  if (name.includes("pipe") || name.includes("chemical") || name.includes("refinery")) return "#7fb8be";
  if (name.includes("rail") || name.includes("train")) return "#9a8c76";
  if (name.includes("solar") || name.includes("accumulator")) return "#476e9f";
  if (name.includes("turret") || name.includes("wall")) return "#8b9a56";
  if (name.includes("pole") || name.includes("substation")) return "#c69a55";
  return "#9fb0bd";
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function directionVector(direction = 0) {
  const vectors = [
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
  ];
  return vectors[direction % vectors.length] ?? vectors[0];
}

function getCanvasSize(canvas: HTMLCanvasElement) {
  return {
    width: Math.max(320, Math.round(canvas.parentElement?.clientWidth || canvas.clientWidth || 900)),
    height: Math.max(320, Math.round(canvas.clientHeight || 420)),
  };
}

async function renderSpriteBlueprintPreview(
  canvas: HTMLCanvasElement,
  blueprintString: string,
): Promise<BlueprintPreviewHandle> {
  const { Book, Editor, getBlueprintOrBookFromSource } = await import("@/src/vendor/fbe-editor");
  const editor = new Editor();
  const size = getCanvasSize(canvas);

  try {
    await editor.init(canvas, undefined, {
      previewOnly: true,
      width: size.width,
      height: size.height,
    });

    const blueprintOrBook = await getBlueprintOrBookFromSource(sanitizeBlueprintStringForSpriteRenderer(blueprintString));
    const blueprint = blueprintOrBook instanceof Book
      ? blueprintOrBook.selectBlueprint()
      : blueprintOrBook;

    await editor.loadBlueprint(blueprint);
    editor.resize(size.width, size.height);
    await editor.waitForTextures();
    editor.resize(size.width, size.height);

    const resizeObserver = new ResizeObserver(() => {
      const nextSize = getCanvasSize(canvas);
      editor.resize(nextSize.width, nextSize.height);
    });
    resizeObserver.observe(canvas.parentElement ?? canvas);

    return {
      mode: "sprites",
      destroy: () => {
        resizeObserver.disconnect();
        editor.destroy();
      },
    };
  } catch (error) {
    editor.destroy();
    throw error;
  }
}

function renderSchematicBlueprintPreview(canvas: HTMLCanvasElement, blueprintString: string) {
  if (typeof window === "undefined") throw new Error("Blueprint previews can only render in the browser.");

  const blueprint = selectBlueprint(decodeBlueprintString(blueprintString));
  const entities = blueprint.entities ?? [];
  const tiles = blueprint.tiles ?? [];

  if (!entities.length && !tiles.length) throw new Error("Blueprint has no entities or tiles to preview.");

  const rects = entities.map((entity) => {
    const size = entitySize(entity.name);
    return {
      entity,
      x: (entity.position.x - size.w / 2) * TILE,
      y: (entity.position.y - size.h / 2) * TILE,
      w: size.w * TILE,
      h: size.h * TILE,
    };
  });

  const tileRects = tiles.map((tile) => ({ tile, x: tile.position.x * TILE, y: tile.position.y * TILE, w: TILE, h: TILE }));
  const allRects = [...rects, ...tileRects];
  const minX = Math.min(...allRects.map((rect) => rect.x));
  const minY = Math.min(...allRects.map((rect) => rect.y));
  const maxX = Math.max(...allRects.map((rect) => rect.x + rect.w));
  const maxY = Math.max(...allRects.map((rect) => rect.y + rect.h));

  const { width: cssWidth, height: cssHeight } = getCanvasSize(canvas);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is unavailable.");

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const background = ctx.createRadialGradient(cssWidth / 2, cssHeight / 2, 10, cssWidth / 2, cssHeight / 2, Math.max(cssWidth, cssHeight) * 0.7);
  background.addColorStop(0, "#172331");
  background.addColorStop(1, "#080c11");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  const padding = 44;
  const scale = Math.min((cssWidth - padding * 2) / Math.max(maxX - minX, TILE), (cssHeight - padding * 2) / Math.max(maxY - minY, TILE), 1.9);
  const offsetX = (cssWidth - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY = (cssHeight - (maxY - minY) * scale) / 2 - minY * scale;
  const tx = (x: number) => x * scale + offsetX;
  const ty = (y: number) => y * scale + offsetY;

  ctx.strokeStyle = "rgba(111, 142, 174, 0.16)";
  ctx.lineWidth = 1;
  const gridStep = TILE * scale;
  for (let x = offsetX % gridStep; x < cssWidth; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, cssHeight);
    ctx.stroke();
  }
  for (let y = offsetY % gridStep; y < cssHeight; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cssWidth, y);
    ctx.stroke();
  }

  for (const rect of tileRects) {
    ctx.fillStyle = "rgba(72, 91, 74, 0.42)";
    ctx.fillRect(tx(rect.x), ty(rect.y), rect.w * scale, rect.h * scale);
  }

  for (const { entity, x, y, w, h } of rects.sort((a, b) => a.y - b.y)) {
    const sx = tx(x);
    const sy = ty(y);
    const sw = Math.max(4, w * scale);
    const sh = Math.max(4, h * scale);
    const color = entityColor(entity.name);

    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    drawRoundedRect(ctx, sx + 2, sy + 3, sw, sh, Math.min(8, sw / 5));
    ctx.fill();

    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255,255,255,0.34)";
    ctx.lineWidth = Math.max(1, scale * 1.2);
    drawRoundedRect(ctx, sx, sy, sw, sh, Math.min(8, sw / 5));
    ctx.fill();
    ctx.stroke();

    const centerX = sx + sw / 2;
    const centerY = sy + sh / 2;
    const vector = directionVector(entity.direction);
    ctx.strokeStyle = "rgba(7, 10, 14, 0.52)";
    ctx.lineWidth = Math.max(2, scale * 3);
    ctx.beginPath();
    ctx.moveTo(centerX - vector.x * sw * 0.18, centerY - vector.y * sh * 0.18);
    ctx.lineTo(centerX + vector.x * sw * 0.28, centerY + vector.y * sh * 0.28);
    ctx.stroke();

    if (sw > 24 && sh > 18) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `${Math.max(9, Math.min(13, sw / 5))}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(entity.name.split("-").map((part) => part[0]).join("").slice(0, 4).toUpperCase(), centerX, centerY);
    }
  }
}

function renderSchematicBlueprintPreviewHandle(
  canvas: HTMLCanvasElement,
  blueprintString: string,
  spriteError?: unknown,
): BlueprintPreviewHandle {
  renderSchematicBlueprintPreview(canvas, blueprintString);

  const resizeObserver = new ResizeObserver(() => {
    try {
      renderSchematicBlueprintPreview(canvas, blueprintString);
    } catch (error) {
      console.warn("Could not redraw schematic blueprint preview after resize.", error);
    }
  });
  resizeObserver.observe(canvas.parentElement ?? canvas);

  return {
    mode: "schematic",
    spriteError,
    destroy: () => {
      resizeObserver.disconnect();
    },
  };
}

export async function renderBlueprintPreview(
  canvas: HTMLCanvasElement,
  blueprintString: string,
  options: RenderBlueprintPreviewOptions = {},
): Promise<BlueprintPreviewHandle> {
  if (options.useSprites) {
    try {
      return await renderSpriteBlueprintPreview(canvas, blueprintString);
    } catch (spriteError) {
      console.warn("Factorio sprite preview failed; using schematic fallback.", spriteError);

      const fallbackCanvas = document.createElement("canvas");
      fallbackCanvas.setAttribute("aria-label", canvas.getAttribute("aria-label") ?? "Blueprint preview");
      fallbackCanvas.tabIndex = -1;
      canvas.insertAdjacentElement("afterend", fallbackCanvas);
      canvas.style.display = "none";

      try {
        const fallbackPreview = renderSchematicBlueprintPreviewHandle(fallbackCanvas, blueprintString, spriteError);
        return {
          ...fallbackPreview,
          destroy: () => {
            fallbackPreview.destroy();
            fallbackCanvas.remove();
            canvas.style.display = "";
          },
        };
      } catch (fallbackError) {
        fallbackCanvas.remove();
        canvas.style.display = "";
        throw fallbackError;
      }
    }
  }

  return renderSchematicBlueprintPreviewHandle(canvas, blueprintString);
}

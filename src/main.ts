import { ViewSettings } from "./ViewSettings";
import { setup_canvas } from "./canvas_handler";

function render(wasm: any, ctx: CanvasRenderingContext2D, view: ViewSettings) {
  let newCanvas = document.createElement("canvas");
  const newCanvasContext = newCanvas.getContext("2d");
  if (newCanvasContext === null) {
    console.error("Could not acquire new canvas context");
    return;
  }
  console.log("Rendering with ", view);
  wasm.draw(
    newCanvasContext,
    Math.floor(ctx.canvas.clientWidth / view.zoom),
    Math.floor(ctx.canvas.clientHeight / view.zoom),
    Math.max(1, Math.floor(view.start_x)).toString(),
    Math.max(1, Math.floor(view.start_y)).toString()
  );
  ctx.clearRect(0, 0, ctx.canvas.clientHeight, ctx.canvas.clientWidth);
  ctx.resetTransform();
  ctx.scale(view.zoom, view.zoom);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(newCanvas, 0, 0);
}

async function setup() {
  const wasm_module = await import("../compute/Cargo.toml");
  const wasm = await wasm_module.default();

  const canvas = document.getElementById("drawing") as HTMLCanvasElement;
  const position_output =
    document.querySelector<HTMLSpanElement>("#positionText");
  if (position_output === null) {
    console.error("Could not find textbox");
    return;
  }
  if (canvas === null) {
    console.error("Could not find canvas element");
    return;
  }
  const view = { start_x: 1, start_y: 1, zoom: 6, dirty: true };
  setup_canvas(canvas, view);
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("Could not acquire canvas context");
  }

  setInterval(() => {
    if (!view.dirty) return;
    view.dirty = false;
    render(wasm, ctx, view);
    position_output.innerText = `${Math.floor(view.start_x)}/${Math.floor(view.start_y)}`;
  }, 33);
}

setup();

interface ViewSettings {
  start_x: number;
  start_y: number;
  zoom: number;
  dirty: boolean;
}
function a(canvas: HTMLCanvasElement, view: ViewSettings) {
  const MAX_ZOOM = 6;
  const MIN_ZOOM = 1;
  let SCROLL_SENSITIVITY = 0.005;

  function getEventLocation(e: MouseEvent | TouchEvent): {
    x: number;
    y: number;
  } {
    if ("touches" in e) {
      console.assert(e.touches.length == 1);
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      console.assert("clientX" in e);
      return { x: e.clientX, y: e.clientY };
    }
  }
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };

  function onPointerDown(e: TouchEvent | MouseEvent) {
    isDragging = true;
    dragStart.x = view.start_x + getEventLocation(e).x / view.zoom;
    dragStart.y = view.start_y + getEventLocation(e).y / view.zoom;
  }

  function onPointerUp(e: TouchEvent | MouseEvent) {
    isDragging = false;
    initialPinchDistance = null;
    lastZoom = view.zoom;
  }

  function onPointerMove(e: MouseEvent | TouchEvent) {
    if (isDragging) {
      console.dir(view);
      view.start_x = -getEventLocation(e).x / view.zoom + dragStart.x;
      view.start_y = -getEventLocation(e).y / view.zoom + dragStart.y;
      view.start_x = Math.max(1, view.start_x);
      view.start_y = Math.max(1, view.start_y);
      view.dirty = true;
    }
  }

  function handleTouch(
    e: TouchEvent,
    singleTouchHandler: (e: MouseEvent | TouchEvent) => void
  ) {
    if (e.touches.length == 1) {
      singleTouchHandler(e);
    } else if (e.type == "touchmove" && e.touches.length == 2) {
      isDragging = false;
      handlePinch(e);
    }
  }

  let initialPinchDistance = null as null | number;
  let lastZoom = view.zoom;

  function handlePinch(e: TouchEvent) {
    e.preventDefault();

    let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };

    // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
    let currentDistance =
      (touch1.x - touch2.x) ** 2 + (touch1.y - touch2.y) ** 2;

    if (initialPinchDistance === null) {
      initialPinchDistance = currentDistance;
    } else {
      adjustZoom(null, currentDistance / initialPinchDistance);
    }
  }

  function adjustZoom(
    zoomAmount: number | null | undefined,
    zoomFactor: number | null | undefined
  ) {
    if (!isDragging) {
      if (zoomAmount) {
        view.zoom += zoomAmount;
      } else if (zoomFactor) {
        console.log(zoomFactor);
        view.zoom = zoomFactor * lastZoom;
      }
      view.dirty = true;

      view.zoom = Math.min(view.zoom, MAX_ZOOM);
      view.zoom = Math.max(view.zoom, MIN_ZOOM);

      console.log(zoomAmount);
    }
  }

  canvas.addEventListener("mousedown", onPointerDown);
  canvas.addEventListener("touchstart", (e) => handleTouch(e, onPointerDown));
  canvas.addEventListener("mouseup", onPointerUp);
  canvas.addEventListener("touchend", (e) => handleTouch(e, onPointerUp));
  canvas.addEventListener("mousemove", onPointerMove);
  canvas.addEventListener("touchmove", (e) => handleTouch(e, onPointerMove));
  canvas.addEventListener("wheel", (e) =>
    adjustZoom(e.deltaY * SCROLL_SENSITIVITY, null)
  );
}
function define_drag_handlers(canvas: HTMLCanvasElement, view: ViewSettings) {
  let last_position = { lp: undefined as undefined | [number, number] };
  canvas.addEventListener("mousedown", (e) => {
    last_position.lp = [e.clientX, e.clientY];
  });
  canvas.addEventListener("mouseup", (e) => {
    last_position.lp = undefined;
  });
  canvas.addEventListener("mousemove", (e) => {
    let lp = last_position.lp;
    if (lp === undefined) return;
    let delta_x = e.clientX - lp[0];
    let delta_y = e.clientY - lp[1];
    last_position.lp = [e.clientX, e.clientY];
    view.start_x -= delta_x / view.zoom;
    view.start_y -= delta_y / view.zoom;
    view.dirty = true;
  });
  canvas.addEventListener("scroll", (e) => {});
}

function run_with_module(wasm: any) {}

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
  const wasm = await import("./pkg");
  const canvas = document.getElementById("drawing") as HTMLCanvasElement;
  if (canvas === null) {
    console.error("Could not find canvas element");
    return;
  }
  const view = { start_x: 1, start_y: 1, zoom: 6, dirty: true };
  a(canvas, view);
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("Could not acquire canvas context");
  }

  setInterval(() => {
    if (!view.dirty) return;
    view.dirty = false;
    render(wasm, ctx, view);
  }, 33);
}

setup();

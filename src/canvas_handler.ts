import { ViewSettings } from "./ViewSettings";

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

export function setup_canvas(canvas: HTMLCanvasElement, view: ViewSettings) {
  const MAX_ZOOM = 6;
  const MIN_ZOOM = 1;
  let SCROLL_SENSITIVITY = 0.005;

  let isDragging = false;
  let dragStart = { x: 0, y: 0 };

  function onPointerDown(e: TouchEvent | MouseEvent) {
    isDragging = true;
    dragStart.x = view.start_x + getEventLocation(e).x / view.zoom;
    dragStart.y = view.start_y + getEventLocation(e).y / view.zoom;
  }

  function onPointerUp(_e: TouchEvent | MouseEvent) {
    isDragging = false;

    initialPinchDistance = null;
    lastZoom = view.zoom;
  }

  function onPointerMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) {
      return;
    }
    view.start_x = -getEventLocation(e).x / view.zoom + dragStart.x;
    view.start_y = -getEventLocation(e).y / view.zoom + dragStart.y;
    view.start_x = Math.max(1, view.start_x);
    view.start_y = Math.max(1, view.start_y);
    view.dirty = true;
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
    if (isDragging) {
      return;
    }
    if (zoomAmount) {
      view.zoom += zoomAmount;
    } else if (zoomFactor) {
      view.zoom = zoomFactor * lastZoom;
    }
    view.dirty = true;

    view.zoom = Math.min(view.zoom, MAX_ZOOM);
    view.zoom = Math.max(view.zoom, MIN_ZOOM);
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

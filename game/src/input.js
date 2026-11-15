// Keyboard and mouse input, translated into the game's own actions so the loop
// never reads the DOM directly. Pointer positions arrive in field coordinates
// (the canvas is scaled to fit the window, so they are un-scaled first).
export const ACTION_CONFIRM = 'confirm';
export const ACTION_RESTART = 'restart';
export const ACTION_NEXT = 'next';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';

export function createInput(canvas, scaleToField) {
  const keys = new Set();
  const actions = [];
  let pointer = { x: 0, y: 0, down: false, dragging: false };

  function fieldPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return scaleToField(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);
  }

  canvas.addEventListener('pointerdown', (event) => {
    const position = fieldPosition(event);
    pointer = { x: position.x, y: position.y, down: true, dragging: true };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    const position = fieldPosition(event);
    pointer = { ...pointer, x: position.x, y: position.y };
  });
  function endPointer(event) {
    const position = fieldPosition(event);
    pointer = { x: position.x, y: position.y, down: false, dragging: false };
    actions.push({ type: 'release', x: position.x, y: position.y });
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'Enter' || event.code === 'Space') actions.push({ type: ACTION_CONFIRM });
    if (event.code === 'KeyR') actions.push({ type: ACTION_RESTART });
    if (event.code === 'KeyN') actions.push({ type: ACTION_NEXT });
    if (event.code === 'KeyP') actions.push({ type: ACTION_PAUSE });
    if (event.code === 'KeyM') actions.push({ type: ACTION_MUTE });
    if (event.code === 'Space') event.preventDefault();
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => {
    keys.clear();
    pointer = { ...pointer, down: false, dragging: false };
  });

  return {
    /** Drain the actions queued since the last frame, oldest first. */
    drainActions() {
      return actions.splice(0, actions.length);
    },
    /** The pointer's current field position and whether it is held down. */
    pointer() {
      return pointer;
    },
    /** True while the named key is held. */
    keyHeld(code) {
      return keys.has(code);
    },
  };
}

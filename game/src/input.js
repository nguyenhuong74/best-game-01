// Input: pointer drags for aiming and clicks for buttons, plus the keyboard.
// The game loop drains a queue of actions each frame; the live pointer state
// drives the aim preview. Coordinates are converted to field space by the
// caller-supplied `toField`, so the canvas can scale with the window.
export const ACTION_KEY = 'key';
export const ACTION_PRESS = 'press';
export const ACTION_RELEASE = 'release';

export function createInput(canvas, toField) {
  const actions = [];
  const pointer = { x: 0, y: 0, down: false, downAt: null };

  function fieldPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return toField(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = fieldPoint(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.down = true;
    pointer.downAt = point;
    actions.push({ type: ACTION_PRESS, x: point.x, y: point.y });
    event.preventDefault();
  });
  window.addEventListener('pointermove', (event) => {
    const point = fieldPoint(event);
    pointer.x = point.x;
    pointer.y = point.y;
  });
  window.addEventListener('pointerup', (event) => {
    if (!pointer.down) return;
    const point = fieldPoint(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.down = false;
    pointer.downAt = null;
    actions.push({ type: ACTION_RELEASE, x: point.x, y: point.y });
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    actions.push({ type: ACTION_KEY, key: event.key.toLowerCase() });
  });

  return {
    pointer() {
      return pointer;
    },
    drainActions() {
      return actions.splice(0, actions.length);
    },
  };
}

/** The button under a point, if any, from the list the last screen drew. */
export function buttonAt(buttons, x, y) {
  for (const button of buttons) {
    if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) return button;
  }
  return null;
}

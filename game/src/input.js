// Keyboard and mouse for Midnight Archive: WASD or arrows to walk, click a floor
// tile to walk there, Enter to start, R to restart, P to pause, M to mute.

export function createInput(canvas) {
  const keys = new Set();
  let clickTarget = null;

  const onKeyDown = (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    keys.add(event.key.toLowerCase());
  };
  const onKeyUp = (event) => keys.delete(event.key.toLowerCase());
  const onBlur = () => keys.clear();
  const onPointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    clickTarget = {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointerdown', onPointer);

  return {
    /** The move direction from the keys, or null when no key is held. */
    keyDirection() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      return x === 0 && y === 0 ? null : { x, y };
    },
    /** The last clicked floor point, or null. */
    takeClick() {
      const target = clickTarget;
      clickTarget = null;
      return target;
    },
    /** True once when the named key was pressed since the last call. */
    pressed(key) {
      if (keys.has(key)) {
        keys.delete(key);
        return true;
      }
      return false;
    },
    hasClick() {
      return clickTarget !== null;
    },
  };
}

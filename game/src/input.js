// Keyboard + mouse input: one place owns every key, the game only reads
// pressed / held edges through the callbacks main.js registers.
export function createInput(canvas, hooks) {
  const held = new Set();
  const input = {
    held,
    jumpQueued: false,
    gobbleQueued: false,
    anyKey() {
      return held.size > 0;
    },
    isDown(code) {
      return held.has(code);
    },
    sprinting() {
      return held.has('ShiftLeft') || held.has('ShiftRight');
    },
    sliding() {
      return held.has('ArrowDown') || held.has('KeyS');
    },
    consumeJump() {
      const v = input.jumpQueued;
      input.jumpQueued = false;
      return v;
    },
    consumeGobble() {
      const v = input.gobbleQueued;
      input.gobbleQueued = false;
      return v;
    },
  };

  function onKeyDown(e) {
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    held.add(e.code);
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') input.jumpQueued = true;
    if (e.code === 'KeyG') input.gobbleQueued = true;
    if (hooks.onKey) hooks.onKey(e.code);
  }

  function onKeyUp(e) {
    held.delete(e.code);
  }

  function onMouseDown(e) {
    if (e.button === 2) {
      input.gobbleQueued = true;
      return;
    }
    if (e.button === 0) {
      input.jumpQueued = true;
      if (hooks.onClick) hooks.onClick(e.clientX, e.clientY);
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('contextmenu', onContextMenu);
  return input;
}

import { useEffect, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";

const HOLD_MS = 600;
const MOVE_TOLERANCE = 10;

type Register = () => void;
type Point = { x: number; y: number };

function swallowNextClick() {
  const stop = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    window.removeEventListener("click", stop, true);
  };
  window.addEventListener("click", stop, true);
  window.setTimeout(() => window.removeEventListener("click", stop, true), 400);
}

export function useRegisterPress() {
  const timer = useRef<number | null>(null);
  const origin = useRef<Point | null>(null);
  const armed = useRef<Register | null>(null);
  const ignoreUntil = useRef(0);

  const clearTimer = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const cancel = () => {
    clearTimer();
    origin.current = null;
    armed.current = null;
  };

  useEffect(() => cancel, []);

  const start = (register: Register, point?: Point) => {
    if (Date.now() < ignoreUntil.current) return;
    cancel();
    origin.current = point ?? null;
    timer.current = window.setTimeout(() => {
      timer.current = null;
      armed.current = register;
    }, HOLD_MS);
  };

  const move = (point: Point) => {
    if (!origin.current || (timer.current == null && !armed.current)) return;
    const dx = point.x - origin.current.x;
    const dy = point.y - origin.current.y;
    if (dx * dx + dy * dy > MOVE_TOLERANCE * MOVE_TOLERANCE) cancel();
  };

  const finish = () => {
    const register = armed.current;
    cancel();
    if (!register) return;
    ignoreUntil.current = Date.now() + 700;
    swallowNextClick();
    register();
  };

  const open = (register: Register) => {
    cancel();
    register();
  };

  return { start, move, finish, cancel, open };
}

type Press = ReturnType<typeof useRegisterPress>;

function isControl(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("a, button, input, select, textarea, label"));
}

export function bindRegisterPress(
  press: Press,
  register: Register,
  options?: { ignoreControls?: boolean },
) {
  const blocked = (target: EventTarget | null) => Boolean(options?.ignoreControls && isControl(target));

  return {
    onDoubleClick: (event: ReactMouseEvent) => {
      if (blocked(event.target)) return;
      event.preventDefault();
      press.open(register);
    },
    onMouseDown: (event: ReactMouseEvent) => {
      if (event.button !== 0 || blocked(event.target)) return;
      press.start(register, { x: event.clientX, y: event.clientY });
    },
    onMouseMove: (event: ReactMouseEvent) => {
      press.move({ x: event.clientX, y: event.clientY });
    },
    onMouseUp: () => press.finish(),
    onMouseLeave: () => press.cancel(),
    onTouchStart: (event: ReactTouchEvent) => {
      if (blocked(event.target)) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      press.start(register, { x: touch.clientX, y: touch.clientY });
    },
    onTouchMove: (event: ReactTouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      press.move({ x: touch.clientX, y: touch.clientY });
    },
    onTouchEnd: () => press.finish(),
    onTouchCancel: () => press.cancel(),
    onContextMenu: (event: ReactMouseEvent) => {
      if (blocked(event.target)) return;
      event.preventDefault();
    },
  };
}

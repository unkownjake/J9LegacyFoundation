import { useCallback, useRef, useState } from "react";

/**
 * Minimal undo/redo state container. Tracks past/present/future snapshots.
 * Equality is reference-based — pass new objects for changes to register.
 */
export function useHistoryState<T>(initial: T) {
  const [present, setPresent] = useState<T>(initial);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [, force] = useState(0);
  const tick = () => force((n) => n + 1);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setPresent((prev) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        if (Object.is(value, prev)) return prev;
        pastRef.current.push(prev);
        futureRef.current = [];
        return value;
      });
      tick();
    },
    [],
  );

  const reset = useCallback((value: T) => {
    pastRef.current = [];
    futureRef.current = [];
    setPresent(value);
    tick();
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    setPresent((prev) => {
      const previous = pastRef.current.pop()!;
      futureRef.current.push(prev);
      return previous;
    });
    tick();
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    setPresent((prev) => {
      const next = futureRef.current.pop()!;
      pastRef.current.push(prev);
      return next;
    });
    tick();
  }, []);

  return {
    state: present,
    set,
    reset,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}

import type { DemoState, Preferences } from "../context/types";
import { initialCompleted, routine } from "../data/mockData";
export const defaultState: DemoState = {
  preferences: {
    largeText: false,
    highContrast: false,
    reducedMotion: false,
    voice: true,
    volume: 0.7,
    confirmSpeech: true,
    fewerOptions: false,
    calm: false,
    view: "self",
  },
  completed: initialCompleted,
  steps: {},
};
const key = "neuroin-demo-v1";
export function loadState(): DemoState {
  const fallback = structuredClone(defaultState);
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "null");
    if (!raw || typeof raw !== "object") return fallback;
    const p = raw.preferences;
    if (p && typeof p === "object") {
      for (const name of Object.keys(
        fallback.preferences,
      ) as (keyof Preferences)[]) {
        if (
          typeof fallback.preferences[name] === "boolean" &&
          typeof p[name] === "boolean"
        )
          Object.assign(fallback.preferences, { [name]: p[name] });
      }
      if (typeof p.volume === "number" && Number.isFinite(p.volume))
        fallback.preferences.volume = Math.max(0, Math.min(1, p.volume));
      if (p.view === "self" || p.view === "support")
        fallback.preferences.view = p.view;
    }
    if (Array.isArray(raw.completed))
      fallback.completed = [
        ...new Set<string>(
          raw.completed.filter(
            (id: unknown) =>
              typeof id === "string" && routine.some((r) => r.id === id),
          ),
        ),
      ];
    if (raw.steps && typeof raw.steps === "object")
      for (const r of routine) {
        const saved = raw.steps[r.id];
        if (Array.isArray(saved))
          fallback.steps[r.id] = [
            ...new Set<number>(
              saved.filter(
                (i: unknown) =>
                  Number.isInteger(i) &&
                  Number(i) >= 0 &&
                  Number(i) < r.steps.length,
              ),
            ),
          ];
      }
    return fallback;
  } catch {
    return fallback;
  }
}
export function saveState(state: DemoState): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

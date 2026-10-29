import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { Preferences } from "./types";
import { loadState, saveState, defaultState } from "../utils/storage";
const Context = createContext<{
  preferences: Preferences;
  updatePreferences: (patch: Partial<Preferences>) => void;
  completed: string[];
  toggleCompleted: (id: string) => void;
  steps: Record<string, number[]>;
  toggleStep: (id: string, index: number) => void;
  reset: () => void;
  storageError: boolean;
} | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadState);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    setStorageError(!saveState(state));
  }, [state]);
  const updatePreferences = useCallback(
    (patch: Partial<Preferences>) =>
      setState((s) => ({ ...s, preferences: { ...s.preferences, ...patch } })),
    [],
  );
  const toggleCompleted = (id: string) =>
    setState((s) => ({
      ...s,
      completed: s.completed.includes(id)
        ? s.completed.filter((v) => v !== id)
        : [...s.completed, id],
    }));
  const toggleStep = (id: string, index: number) =>
    setState((s) => {
      const old = s.steps[id] ?? [];
      return {
        ...s,
        steps: {
          ...s.steps,
          [id]: old.includes(index)
            ? old.filter((v) => v !== index)
            : [...old, index],
        },
      };
    });
  const reset = () => {
    window.speechSynthesis?.cancel();
    setState(structuredClone(defaultState));
  };
  return (
    <Context.Provider
      value={{
        ...state,
        updatePreferences,
        toggleCompleted,
        toggleStep,
        reset,
        storageError,
      }}
    >
      {children}
    </Context.Provider>
  );
}
// Context and provider intentionally share a small module.
// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const c = useContext(Context);
  if (!c) throw new Error("AppProvider ausente");
  return c;
}

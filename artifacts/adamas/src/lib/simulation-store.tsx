import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { SimulationResult, SimulationInput } from "@workspace/api-client-react";
import { readStorage, removeStorage, writeStorage } from "./storage";

interface SimulationState {
  lastResult: SimulationResult | null;
  lastInput: SimulationInput | null;
  setSimulationData: (input: SimulationInput, result: SimulationResult) => void;
  clearSimulationData: () => void;
}

const SimulationContext = createContext<SimulationState | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);
  const [lastInput, setLastInput] = useState<SimulationInput | null>(null);

  useEffect(() => {
    try {
      const storedResult = readStorage("adamas_last_result");
      const storedInput = readStorage("adamas_last_input");
      if (storedResult) setLastResult(JSON.parse(storedResult));
      if (storedInput) setLastInput(JSON.parse(storedInput));
    } catch (err) {
      console.error("Failed to load simulation from local storage", err);
    }
  }, []);

  const setSimulationData = (input: SimulationInput, result: SimulationResult) => {
    setLastInput(input);
    setLastResult(result);
    writeStorage("adamas_last_input", JSON.stringify(input));
    writeStorage("adamas_last_result", JSON.stringify(result));
  };

  const clearSimulationData = () => {
    setLastInput(null);
    setLastResult(null);
    removeStorage("adamas_last_input");
    removeStorage("adamas_last_result");
  };

  return (
    <SimulationContext.Provider value={{ lastResult, lastInput, setSimulationData, clearSimulationData }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulationStore() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error("useSimulationStore must be used within a SimulationProvider");
  }
  return context;
}

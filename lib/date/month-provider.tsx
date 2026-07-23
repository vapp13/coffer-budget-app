"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { monthKeyFromDate, type MonthKey } from "@/lib/date/month";

const STORAGE_KEY = "coffer-selected-month";

function currentMonthKey(): MonthKey {
  return monthKeyFromDate(new Date());
}

type MonthContextValue = {
  selectedMonth: MonthKey;
  setSelectedMonth: (month: MonthKey) => void;
  goToCurrentMonth: () => void;
};

const MonthContext = createContext<MonthContextValue | undefined>(undefined);

export function MonthProvider({ children }: { children: ReactNode }) {
  const [selectedMonth, setSelectedMonthState] = useState<MonthKey>(currentMonthKey);

  // Restore whatever month the user was last looking at, once mounted.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (typeof parsed?.year === "number" && typeof parsed?.month === "number") {
        setSelectedMonthState(parsed);
      }
    } catch {
      // Ignore malformed/unavailable storage — just keep the current month.
    }
  }, []);

  function setSelectedMonth(month: MonthKey) {
    setSelectedMonthState(month);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(month));
    } catch {
      // Storage can be unavailable — the selection just won't persist.
    }
  }

  function goToCurrentMonth() {
    setSelectedMonth(currentMonthKey());
  }

  return (
    <MonthContext.Provider value={{ selectedMonth, setSelectedMonth, goToCurrentMonth }}>
      {children}
    </MonthContext.Provider>
  );
}

export function useSelectedMonth() {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error("useSelectedMonth must be used within a MonthProvider");
  }
  return context;
}

"use client";

import { useState, type ComponentType } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

type DropdownMenuProps<T extends string> = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function DropdownMenu<T extends string>({
  label,
  icon: Icon,
  options,
  value,
  onChange,
}: DropdownMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 z-50 mt-2 w-56 rounded-lg border border-border bg-surface p-1 shadow-lg">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                  value === option.value && "font-medium text-primary"
                )}
              >
                {option.label}
                {value === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

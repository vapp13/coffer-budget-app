"use client";

import type { ChangeEvent } from "react";
import { UploadCloud } from "lucide-react";

type CsvFileInputProps = {
  onFileSelected: (file: File) => void;
  label: string;
};

export function CsvFileInput({ onFileSelected, label }: CsvFileInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFileSelected(file);
    event.target.value = ""; // allow re-selecting the same file next time
  }

  return (
    <label className="flex min-h-[44px] w-fit cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:bg-muted">
      <UploadCloud className="h-4 w-4" />
      {label}
      <input type="file" accept=".csv" className="hidden" onChange={handleChange} />
    </label>
  );
}

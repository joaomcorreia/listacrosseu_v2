"use client";

import { Grid2X2, List } from "lucide-react";

export type DirectoryView = "grid" | "list";

interface DirectoryViewToggleProps {
  value: DirectoryView;
  onChange: (value: DirectoryView) => void;
}

export default function DirectoryViewToggle({ value, onChange }: DirectoryViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm" aria-label="Result view">
      {(["grid", "list"] as const).map((mode) => {
        const selected = value === mode;
        const Icon = mode === "grid" ? Grid2X2 : List;
        const label = mode === "grid" ? "Grid" : "List";
        return (
          <button
            key={mode}
            type="button"
            aria-label={`Show results as ${label.toLowerCase()}`}
            aria-pressed={selected}
            onClick={() => onChange(mode)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${selected ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { MessageSquare } from "lucide-react";

interface ListyButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ListyButton({ onClick, isOpen }: ListyButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
        isOpen ? 'scale-95 opacity-75' : 'hover:scale-105'
      }`}
      aria-label="Open Listy helper"
    >
      <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-medium">Listy</span>
        </div>
      </div>
    </button>
  );
}
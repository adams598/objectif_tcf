"use client";

import React from "react";

const FRENCH_CHARS = [
  "é", "è", "ê", "à", "ù", "û", "ô", "ç", "œ", "ï", "ë", "â", "î",
  "!", "?", ".", ",", ";", ":", "'", '"', "«", "»", "À", "É", "È", "Â", "Œ",
];

interface FrenchKeyboardProps {
  onInsert: (char: string) => void;
}

export function FrenchKeyboard({ onInsert }: FrenchKeyboardProps) {
  return (
    <div className="hidden xl:grid grid-cols-4 gap-1.5 p-sm bg-surface-container-low rounded-xl border border-outline-variant">
      {FRENCH_CHARS.map((char) => (
        <button
          key={char}
          type="button"
          onClick={() => onInsert(char)}
          className="h-9 rounded-lg bg-surface border border-outline-variant font-label-md text-label-md text-on-surface hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
        >
          {char}
        </button>
      ))}
    </div>
  );
}

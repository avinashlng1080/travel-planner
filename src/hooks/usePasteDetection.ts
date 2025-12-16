import { useState, useCallback } from 'react';

export const PASTE_THRESHOLD = 500;

export interface UsePasteDetectionReturn {
  pastedText: string | null;
  characterCount: number;
  isPasteDetected: boolean;
  clearPaste: () => void;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}

export function usePasteDetection(): UsePasteDetectionReturn {
  const [pastedText, setPastedText] = useState<string | null>(null);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.length >= PASTE_THRESHOLD) {
      setPastedText(text);
    }
  }, []);

  const clearPaste = useCallback(() => {
    setPastedText(null);
  }, []);

  return {
    pastedText,
    characterCount: pastedText?.length ?? 0,
    isPasteDetected: pastedText !== null && pastedText.length >= PASTE_THRESHOLD,
    clearPaste,
    handlePaste,
  };
}

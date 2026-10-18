import { useEffect } from "react";

interface Props {
  message: string | null;
  onClear: () => void;
}

export function Toast({ message, onClear }: Props) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onClear, 2600);
    return () => window.clearTimeout(timer);
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div className="app-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

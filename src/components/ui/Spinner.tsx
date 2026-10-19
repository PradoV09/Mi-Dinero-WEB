import { cn } from "../../utils/classNames";

interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label = "Cargando…", className }: SpinnerProps) {
  return (
    <span className={cn("spinner-wrap", className)} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

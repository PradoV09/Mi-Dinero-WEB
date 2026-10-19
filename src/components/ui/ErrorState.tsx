import { AlertTriangle } from "lucide-react";
import { cn } from "../../utils/classNames";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Algo salió mal",
  description = "No pudimos cargar esta información. Inténtalo de nuevo.",
  onRetry,
  retryLabel = "Reintentar",
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("error-state", className)} role="alert">
      <div className="error-state__icon" aria-hidden="true">
        <AlertTriangle size={24} />
      </div>
      <h2 className="error-state__title">{title}</h2>
      <p className="error-state__description">{description}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

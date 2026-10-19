import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
} from "react";
import { cn } from "../../utils/classNames";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hint,
    id,
    className,
    containerClassName,
    required,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("field", containerClassName)}>
      <label className="field__label" htmlFor={inputId}>
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={cn("field__control", error && "field__control--error", className)}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

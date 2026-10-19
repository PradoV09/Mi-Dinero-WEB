import {
  forwardRef,
  useId,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "../../utils/classNames";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      options,
      placeholder,
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
    const selectId = id ?? generatedId;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    const describedBy =
      [ariaDescribedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("field", containerClassName)}>
        <label className="field__label" htmlFor={selectId}>
          {label}
          {required && (
            <span className="field__required" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={cn("field__control", error && "field__control--error", className)}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
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
  },
);

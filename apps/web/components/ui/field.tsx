import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FieldWrapper({ label, htmlFor, error, hint, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ui-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ui-muted">{hint}</p>}
      {error && (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const BASE_INPUT_CLASSES =
  "rounded-[10px] border bg-ui-surface px-3 py-2 text-sm text-ui-ink placeholder:text-ui-muted outline-none transition-colors focus:border-ui-violet focus:ring-2 focus:ring-ui-lilac/60";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({ label, error, hint, id, name, className = "", ...props }: TextFieldProps) {
  const fieldName = name ?? label;
  const fieldId = id ?? fieldName;
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error} hint={hint}>
      <input
        id={fieldId}
        name={fieldName}
        aria-invalid={Boolean(error)}
        className={`${BASE_INPUT_CLASSES} ${
          error ? "border-red-400" : "border-ui-border"
        } ${className}`}
        {...props}
      />
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextAreaField({
  label,
  error,
  hint,
  id,
  name,
  className = "",
  ...props
}: TextAreaFieldProps) {
  const fieldName = name ?? label;
  const fieldId = id ?? fieldName;
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error} hint={hint}>
      <textarea
        id={fieldId}
        name={fieldName}
        aria-invalid={Boolean(error)}
        className={`${BASE_INPUT_CLASSES} ${
          error ? "border-red-400" : "border-ui-border"
        } ${className}`}
        {...props}
      />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: ReactNode;
}

export function SelectField({ label, error, id, name, className = "", children, ...props }: SelectFieldProps) {
  const fieldName = name ?? label;
  const fieldId = id ?? fieldName;
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error}>
      <select
        id={fieldId}
        name={fieldName}
        className={`${BASE_INPUT_CLASSES} ${
          error ? "border-red-400" : "border-ui-border"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}

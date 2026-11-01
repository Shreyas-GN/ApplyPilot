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
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({ label, error, hint, id, name, className = "", ...props }: TextFieldProps) {
  // `name` defaults from the label the same way `id` does — every call
  // site gets a real HTML name attribute (autofill, accessibility tooling,
  // querying) without having to pass one explicitly every time.
  const fieldName = name ?? label;
  const fieldId = id ?? fieldName;
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error} hint={hint}>
      <input
        id={fieldId}
        name={fieldName}
        aria-invalid={Boolean(error)}
        className={`rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-brand-400 ${
          error ? "border-red-400" : "border-slate-300"
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
        className={`rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-brand-400 ${
          error ? "border-red-400" : "border-slate-300"
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
        className={`rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-brand-400 ${
          error ? "border-red-400" : "border-slate-300"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}

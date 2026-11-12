import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "lilac" | "danger" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-ui-wine text-white hover:bg-ui-wine-hover disabled:bg-ui-wine/40 focus-visible:outline-ui-violet",
  secondary:
    "bg-ui-surface text-ui-ink border border-ui-border hover:bg-ui-linen/70 hover:border-ui-muted/50 disabled:text-ui-muted focus-visible:outline-ui-violet",
  lilac:
    "bg-ui-lilac text-ui-ink border border-ui-ink/80 hover:bg-ui-lilac/80 disabled:opacity-50 focus-visible:outline-ui-violet",
  danger:
    "bg-red-700 text-white hover:bg-red-800 disabled:bg-red-300 focus-visible:outline-red-600",
  ghost:
    "bg-transparent text-ui-body hover:bg-ui-linen hover:text-ui-ink disabled:text-ui-muted focus-visible:outline-ui-violet",
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-[10px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

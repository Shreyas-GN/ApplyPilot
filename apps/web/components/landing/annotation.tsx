/**
 * Sparse hand-drawn editorial marks used to punctuate a key product moment.
 * Per docs/design/DESIGN.md §6 "Editorial annotations": vermilion or ink,
 * 1.5–2px stroke, used rarely and tied to a real feature — never decoration.
 */
type AnnotationProps = {
  className?: string;
  color?: "vermilion" | "ink";
};

const strokeColor = {
  vermilion: "var(--color-ap-vermilion)",
  ink: "var(--color-ap-ink)",
};

export function CircleAnnotation({ className = "", color = "vermilion" }: AnnotationProps) {
  return (
    <svg
      viewBox="0 0 120 56"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke={strokeColor[color]}
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M14 30C14 14 32 5 60 5c30 0 48 11 48 25 0 15-20 24-51 24C29 54 10 45 10 30" />
    </svg>
  );
}

export function UnderlineAnnotation({ className = "", color = "vermilion" }: AnnotationProps) {
  return (
    <svg
      viewBox="0 0 160 16"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke={strokeColor[color]}
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M3 10.5c26-4.5 108-7 154-3" />
    </svg>
  );
}

export function ArrowAnnotation({ className = "", color = "vermilion" }: AnnotationProps) {
  return (
    <svg
      viewBox="0 0 90 70"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke={strokeColor[color]}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6c20 18 38 34 76 54" />
      <path d="M58 52c8 1 16 2 24 8" />
      <path d="M68 42c4 7 7 13 14 18" />
    </svg>
  );
}

export function Paw({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={`fill-coral ${className}`}>
      <ellipse cx="16" cy="21" rx="7" ry="6" />
      <circle cx="6.5" cy="13" r="3.2" />
      <circle cx="12" cy="8" r="3.2" />
      <circle cx="20" cy="8" r="3.2" />
      <circle cx="25.5" cy="13" r="3.2" />
    </svg>
  );
}

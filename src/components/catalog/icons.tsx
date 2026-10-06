// Ícones de traço arredondado (2px, pontas redondas). Decorativos: sempre aria-hidden.
function Icon({ className = "h-6 w-6", children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`flex-none ${className}`}
    >
      {children}
    </svg>
  );
}

type P = { className?: string };

export const InfoIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </Icon>
);

export const HeartIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </Icon>
);

export const UsersIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6" />
    <path d="M18 14.3c1.8.7 3 2.2 3 4.7" />
  </Icon>
);

export const SparkIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3v4" />
    <path d="M12 17v4" />
    <path d="M3 12h4" />
    <path d="M17 12h4" />
    <path d="m6.3 6.3 2.4 2.4" />
    <path d="m15.3 15.3 2.4 2.4" />
    <path d="m17.7 6.3-2.4 2.4" />
    <path d="m8.7 15.3-2.4 2.4" />
  </Icon>
);

export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

export const ShareIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="17" cy="6" r="2.5" />
    <circle cx="17" cy="18" r="2.5" />
    <path d="m8.2 10.8 6.6-3.6" />
    <path d="m8.2 13.2 6.6 3.6" />
  </Icon>
);

export const ArrowLeftIcon = (p: P) => (
  <Icon {...p}>
    <path d="m14 6-6 6 6 6" />
  </Icon>
);

export const ArrowRightIcon = (p: P) => (
  <Icon {...p}>
    <path d="m10 6 6 6-6 6" />
  </Icon>
);

export const PawIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 12.5c-2.6 0-4.5 2-4.5 4 0 1.5 1.2 2.5 2.7 2.5 1 0 1.2-.5 1.8-.5s.8.5 1.8.5c1.5 0 2.7-1 2.7-2.5 0-2-1.9-4-4.5-4Z" />
    <circle cx="5.5" cy="11" r="1.7" />
    <circle cx="9.5" cy="6.5" r="1.7" />
    <circle cx="14.5" cy="6.5" r="1.7" />
    <circle cx="18.5" cy="11" r="1.7" />
  </Icon>
);

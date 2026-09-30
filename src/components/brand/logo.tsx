import Link from "next/link";

export function Logo({ size = 48, href = "/" }: { size?: number; href?: string | null }) {
  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/adotehub-emblema.svg" alt="" width={size} height={size} className="flex-none" />
      <span className="font-display text-[28px] font-extrabold leading-none tracking-[-0.03em]">
        <span className="text-verde">Adote</span>
        <span className="text-coral-forte">Hub</span>
      </span>
    </>
  );
  if (!href) return <span className="inline-flex items-center gap-3">{content}</span>;
  return (
    <Link href={href} aria-label="AdoteHub — início" className="inline-flex items-center gap-3 rounded-md">
      {content}
    </Link>
  );
}

export function PlatformHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b border-linha bg-papel">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Logo />
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

export function BrandMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M4 18A14 14 0 0 1 18 4H29V29H4Z" fill="var(--logo-blue, #1f56c4)" />
      <path d="M35 4H46A14 14 0 0 1 60 18V29H35Z" fill="var(--logo-yellow, #ffc933)" />
      <path d="M4 35H29V60H18A14 14 0 0 1 4 46Z" fill="var(--logo-green, #2a9d5c)" />
      <path d="M35 35H60V46A14 14 0 0 1 46 60H35Z" fill="var(--logo-coral, #e5484d)" />
      <circle cx="32" cy="32" r="10" fill="var(--surface, #fff)" />
      <path d="M32 38.8C26 34.8 24.4 31.4 24.4 29C24.4 26.6 26.2 25.2 28.1 25.2C29.7 25.2 31.2 26.1 32 27.6C32.8 26.1 34.3 25.2 35.9 25.2C37.8 25.2 39.6 26.6 39.6 29C39.6 31.4 38 34.8 32 38.8Z" fill="var(--logo-blue, #1f56c4)" />
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand" translate="no">
      <BrandMark />
      <span>Neuro<span className="brand-in">In</span></span>
    </span>
  );
}

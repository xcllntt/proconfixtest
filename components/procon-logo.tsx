export function ProconLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
    >
      {/* Left circle - Pros */}
      <circle cx="22" cy="32" r="14" fill="currentColor" opacity="0.8" />

      {/* Right circle - Cons */}
      <circle cx="42" cy="32" r="14" fill="currentColor" opacity="0.5" />

      {/* Balance line connecting them */}
      <line x1="8" y1="32" x2="56" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

      {/* Center point */}
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </svg>
  )
}

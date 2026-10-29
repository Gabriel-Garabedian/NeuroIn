export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M38 12C28 7 18 13 18 22C7 23 7 38 14 41C9 52 19 61 28 57C29 67 36 70 40 65V45C33 49 28 44 29 39C30 34 35 33 40 36V16Z"
        fill="#0875cf"
      />
      <path
        d="M43 15C50 7 62 13 61 23C73 23 76 36 68 42H49C53 35 49 31 44 32L42 32V15Z"
        fill="#f8c62d"
      />
      <path
        d="M68 45C75 55 65 64 57 60C55 73 44 74 42 66V48C35 53 30 49 31 44C32 39 37 39 42 42V35C47 32 52 36 48 42H66Z"
        fill="#f05e5e"
      />
      <path
        d="M39 48V65C33 73 23 66 25 59C14 62 8 53 14 44H26C23 52 32 57 39 48Z"
        fill="#28ac70"
      />
      <path
        d="M40 3V7M9 15L13 19M3 39H8M9 65L14 62M68 14L65 19M73 63L69 61"
        stroke="#33aa70"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <BrandMark />
      <span>
        Neuro
        <span className="brand-in">
          I<span>n</span>
        </span>
      </span>
    </span>
  );
}

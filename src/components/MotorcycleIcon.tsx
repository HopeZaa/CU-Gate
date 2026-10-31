export default function MotorcycleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="5" cy="17" r="3.5" />
      <circle cx="19" cy="17" r="3.5" />
      <path d="m5 17 4-7h5l5 7M8 10l-2-2H3m8 2 3 7H5m8-11h3l2 7M9 7h4" />
    </svg>
  );
}

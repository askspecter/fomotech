export default function Verified({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      className={className}
      aria-label="verified"
      role="img"
    >
      <path
        fill="currentColor"
        d="m12 1 2.4 1.8 3 .1 1 2.8 2.4 1.7-.9 2.8.9 2.8-2.4 1.7-1 2.8-3 .1L12 23l-2.4-1.8-3-.1-1-2.8L3.2 16l.9-2.8L3.2 10.4l2.4-1.7 1-2.8 3-.1L12 1Z"
      />
      <path fill="#0a0b0f" d="m10.6 15.2-2.5-2.5 1.2-1.2 1.3 1.3 3.4-3.4 1.2 1.2-4.6 4.6Z" />
    </svg>
  );
}

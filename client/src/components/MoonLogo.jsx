export default function MoonLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="none" />
      <path
        d="M65 10C55 10 45.5 14.5 38.5 22C31.5 29.5 27 39.5 27 50.5C27 61.5 31.5 71.5 38.5 79C45.5 86.5 55 91 65 91C55 91 45 88 37 82.5C24 73.5 16 59 16 43C16 27 24 12.5 37 3.5C45 -2 55-3 65 10Z"
        fill="#ffbe55"
      />
    </svg>
  );
}

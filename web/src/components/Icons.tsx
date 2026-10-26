type Props = { name: string; size?: number; color?: string };

const paths: Record<string, string> = {
  university: "M4 12L16 5l12 7H4zM7 14v10M13 14v10M19 14v10M25 14v10M4 27h24",
  scholarship: "M3 12l13-6 13 6-13 6zM8 15v7c0 2 4 4 8 4s8-2 8-4v-7M29 12v8",
  exchange: "M16 5a11 11 0 1 0 0 22 11 11 0 0 0 0-22zM9 13h13l-3-3M23 19H10l3 3",
  cooperation: "M16 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM7 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM25 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM9 27c0-5 3-8 7-8s7 3 7 8M2 25c0-3 2-5 5-5M30 25c0-3-2-5-5-5",
  events: "M7 6h18a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM4 12h24M10 3v6M22 3v6",
  news: "M8 4h16a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM10 10h12M10 15h12M10 20h7",
  language: "M5 7h14v10H11l-4 4v-4H5zM19 12h8v10h-2v4l-4-4h-6v-3",
  visa: "M10 4h12a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM11 11h10M11 16h10M11 21h6",
  housing: "M4 15l12-9 12 9M7 13v13h18V13M13 26v-7h6v7",
  other: "M16 4a12 12 0 1 0 0 24 12 12 0 0 0 0-24zM16 10v7M16 21v1",
};

export default function Icon({ name, size = 26, color = "currentColor" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.other} />
    </svg>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12L19 5l15 7-15 7z" />
      <path d="M10 16v8c0 2 4 5 9 5s9-3 9-5v-8" />
    </svg>
  );
}

export function PlayIcon({ size = 18, color = "#0b6d78" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill={color} aria-hidden="true">
      <path d="M3 1l8 5-8 5z" />
    </svg>
  );
}

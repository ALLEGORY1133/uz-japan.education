import type { ReactNode } from "react";
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

function Svg24({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}
export const PhoneIcon = ({ size = 16 }: { size?: number }) => (
  <Svg24 size={size}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Svg24>
);
export const TelegramIcon = ({ size = 16 }: { size?: number }) => (
  <Svg24 size={size}><path d="M21.5 3.5L2.5 10.8l6.2 2.3 2.3 6.4 3.2-4.2 5.3 3.9z" /><path d="M8.7 13.1l12.8-9.6" /></Svg24>
);
export const HeadsetIcon = ({ size = 18 }: { size?: number }) => (
  <Svg24 size={size}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v5H5a1 1 0 0 1-1-1zM20 14h-3v5h2a1 1 0 0 0 1-1z" /><path d="M17 19c0 1.5-2 2-5 2" /></Svg24>
);

export const MailIcon = ({ size = 18 }: { size?: number }) => (
  <Svg24 size={size}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3.5 7.5l8.5 6 8.5-6" /></Svg24>
);
export const PinIcon = ({ size = 18 }: { size?: number }) => (
  <Svg24 size={size}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></Svg24>
);
export const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <Svg24 size={size}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="3.9" /><circle cx="17.1" cy="6.9" r=".6" fill="currentColor" /></Svg24>
);
export const YouTubeIcon = ({ size = 20 }: { size?: number }) => (
  <Svg24 size={size}><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9.4v5.2l4.4-2.6z" fill="currentColor" /></Svg24>
);
export const LinkedInIcon = ({ size = 20 }: { size?: number }) => (
  <Svg24 size={size}><rect x="3.5" y="3.5" width="17" height="17" rx="3.5" /><path d="M8 10.5V16M8 7.8v.1M12 16v-5.5M12 13a2.6 2.6 0 0 1 5.2 0V16" /></Svg24>
);

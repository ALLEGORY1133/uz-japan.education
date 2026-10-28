import "@fontsource-variable/onest/index.css";
import "@fontsource-variable/bricolage-grotesque/index.css";
import "@fontsource-variable/plus-jakarta-sans/index.css";
import "@fontsource-variable/source-serif-4/index.css";
import "@fontsource-variable/source-serif-4/wght-italic.css";
import "./globals.css";
import "./polish.css";
import "./skin.css";
import "./assistant.css";
import "./steady.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";

const FONT_VARS = {"--f-bricolage": "'Bricolage Grotesque Variable'", "--f-onest": "'Onest Variable'", "--f-jakarta": "'Plus Jakarta Sans Variable'", "--f-serif": "'Source Serif 4 Variable'" } as React.CSSProperties;

export const metadata: Metadata = {
  title: "UzJapan Admin",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" style={FONT_VARS}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

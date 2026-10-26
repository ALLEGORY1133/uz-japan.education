import { mediaUrl } from "@/lib/media";
import type { UniversityListItem } from "@/lib/types";

/** Logotip yoki (logotip yo'q bo'lsa) rangli monogram. */
export default function UniversityMark({ u }: { u: Pick<UniversityListItem, "logo" | "brand_color" | "short_name" | "native_name" | "name"> }) {
  const logo = mediaUrl(u.logo);
  const text = (u.native_name ? u.native_name.slice(0, 1) : u.short_name || u.name.slice(0, 2)).slice(0, 6);
  return (
    <span className={`mono ${u.native_name ? "jp" : ""}`} style={{ background: u.brand_color || "#14183F", fontSize: text.length > 3 ? 10 : 12 }}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" />
      ) : (
        text
      )}
    </span>
  );
}

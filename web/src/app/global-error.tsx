"use client";

/** Layout'ning o'zi yiqilganda ko'rinadigan oxirgi himoya ekrani. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="uz">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f6f4fa", color: "#15132b" }}>
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 72, fontWeight: 800, color: "#e5483b", lineHeight: 1 }}>500</p>
          <h1 style={{ margin: 0, fontSize: 28 }}>Nimadir notöğri ketdi · Something went wrong</h1>
          <p style={{ margin: 0, maxWidth: 460, color: "#6a6785", lineHeight: 1.6 }}>
            Serverda kutilmagan xatolik yuz berdi. Bir neça soniyadan keyin qayta urinib köring.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: 8, minHeight: 48, padding: "12px 26px", border: 0, borderRadius: 999, background: "#e5483b", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            Qayta urinish · Try again
          </button>
        </main>
      </body>
    </html>
  );
}

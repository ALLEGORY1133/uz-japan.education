import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap" style={{ padding: "160px 24px 80px", textAlign: "center" }}>
      <div className="disp" style={{ fontSize: 96, fontWeight: 800, color: "var(--red)", lineHeight: 1 }}>404</div>
      <p style={{ color: "var(--muted)", margin: "12px 0 24px" }}>Sahifa topilmadi · Page not found · ページが見つかりません</p>
      <Link href="/" className="btn btn-primary">Bosh sahifa</Link>
    </main>
  );
}

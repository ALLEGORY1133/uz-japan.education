"use client";

import { useEffect } from "react";

/** Panel ichidagi kutilmagan xatolik: oq ekran o'rniga tushunarli xabar. */
export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="err-box">
      <p className="err-code" aria-hidden="true">500</p>
      <h1>Nimadir notöğri ketdi</h1>
      <p>Sahifani oçişda kutilmagan xatolik yuz berdi. Qayta urinib köring. Takrorlansa, administratorga xabar bering.</p>
      <div className="err-actions">
        <button type="button" className="btn primary" onClick={() => reset()}>Qayta uriniş</button>
        <a className="btn outline" href="/">Boşqaruvga qaytiş</a>
      </div>
      {error.digest && <small className="muted">ID: {error.digest}</small>}
    </div>
  );
}

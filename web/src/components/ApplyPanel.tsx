type Props = {
  mode: "platform" | "external";
  status: "open" | "soon" | "closed";
  applyUrl: string;
  deadline: string;
  startDate?: string;
  labels: Record<string, string>;
};

/** Universitet sahifasidagi yon karta: arizani to'ldirish alohida sahifada (ApplyForm). */
export default function ApplyPanel({ mode, status, applyUrl, deadline, startDate, labels: L }: Props) {
  const head = (
    <>
      <div className="eyebrow">{L.eyebrow}</div>
      <div className="disp" style={{ fontSize: 22, fontWeight: 800, margin: "6px 0 4px" }}>{L.title}</div>
    </>
  );

  if (status === "closed") {
    return (
      <div className="panel" style={{ borderTop: "4px solid var(--muted)" }}>
        {head}
        <p>{L.closed}</p>
      </div>
    );
  }

  if (status === "soon") {
    return (
      <div className="panel" style={{ borderTop: "4px solid #f5a524" }}>
        {head}
        <p>{L.soon}</p>
        {startDate && <p style={{ marginTop: 8 }}>{L.soonFrom}: <b>{startDate}</b></p>}
        {deadline && <p style={{ marginTop: 4 }}>{L.deadline}: <b>{deadline}</b></p>}
      </div>
    );
  }

  if (mode === "external") {
    return (
      <div className="panel" style={{ borderTop: "4px solid var(--red)" }}>
        {head}
        {deadline && <p style={{ marginBottom: 16 }}>{L.deadline}: <b>{deadline}</b></p>}
        <a className="btn btn-primary btn-block" href={applyUrl} target="_blank" rel="noopener noreferrer">
          {L.external} ↗
        </a>
      </div>
    );
  }

  return (
    <div className="panel" id="apply" style={{ borderTop: "4px solid var(--red)" }}>
      {head}
      {deadline && <p>{L.deadline}: <b>{deadline}</b></p>}
      <a className="btn btn-primary btn-block" style={{ marginTop: 16 }} href={L.applyHref}>
        {L.cta}
      </a>
      <p style={{ fontSize: 12, marginTop: 10 }}>{L.noAccount}</p>
      <p style={{ fontSize: 13, marginTop: 6 }}>
        <a href={L.statusHref} style={{ color: "var(--red)", fontWeight: 700 }}>{L.checkStatus} →</a>
      </p>
    </div>
  );
}

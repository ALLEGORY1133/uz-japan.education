"use client";

import { useState } from "react";

type Row = { label: string; value: string };

export default function FundingTabs({
  contractLabel,
  grantLabel,
  contract,
  grant,
}: {
  contractLabel: string;
  grantLabel: string;
  contract: Row[];
  grant: Row[];
}) {
  const hasContract = contract.some((r) => r.value);
  const hasGrant = grant.some((r) => r.value);
  const [tab, setTab] = useState<"contract" | "grant">(hasContract || !hasGrant ? "contract" : "grant");
  const rows = (tab === "contract" ? contract : grant).filter((r) => r.value);

  return (
    <div>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "contract"} onClick={() => setTab("contract")}>
          {contractLabel}
        </button>
        <button type="button" role="tab" aria-selected={tab === "grant"} onClick={() => setTab("grant")}>
          {grantLabel}
        </button>
      </div>
      <div className="kv" role="tabpanel">
        {rows.length === 0 && <div><small>—</small></div>}
        {rows.map((r) => (
          <div key={r.label}>
            <small>{r.label}</small>
            <b>{r.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

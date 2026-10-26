"use client";

export const QUALITIES = [
  { value: "high", label: "Yuqori (2560 px, tavsiya)" },
  { value: "medium", label: "Örtaça (1600 px)" },
  { value: "web", label: "Yengil (1200 px)" },
  { value: "original", label: "Original (özgartirilmaydi)" },
];

/** Rasm yuklash sifati. Video fayllarga ta'sir qilmaydi (video o‘zgartirilmaydi). */
export default function QualitySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="q-select" title="Rasm sifati va ölçami. Video özgartirilmaydi.">
      <span>Rasm sifati</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {QUALITIES.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
      </select>
    </label>
  );
}

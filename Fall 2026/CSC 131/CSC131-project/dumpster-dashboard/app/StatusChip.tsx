import { statusOf } from "@/lib/records";

export default function StatusChip({ fullnessPercent }: { fullnessPercent: number }) {
  const s = statusOf(fullnessPercent);
  return <span className={`status-chip status-${s.toLowerCase()}`}>{s}</span>;
}

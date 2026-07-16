import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { fmt } from "@/lib/mock-data";

export const Route = createFileRoute("/settlements/partial")({
  head: () => ({ meta: [{ title: "Partial Settlement — CollectFlow" }] }),
  component: Partial,
});

const items = [
  { number: "INV-8834", original: 30_000, received: 10_000, balance: 20_000, pct: 33 },
  { number: "INV-8901", original: 22_400, received: 0, balance: 22_400, pct: 0 },
  { number: "INV-9021", original: 25_400, received: 12_500, balance: 12_900, pct: 49 },
];

function Partial() {
  return (
    <AppShell
      title="Partial Settlement"
      subtitle="Track invoices where only part of the amount is paid or a single payment covers multiple invoices."
    >
      <div className="space-y-4">
        {items.map((it) => (
          <div key={it.number} className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <div className="font-mono font-bold">{it.number}</div>
                <div className="text-xs text-muted-foreground">Apex Holdings Pvt Ltd</div>
              </div>
              <StatusPill tone={it.pct >= 50 ? "success" : it.pct > 0 ? "warning" : "danger"}>
                {it.pct}% settled
              </StatusPill>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Stat label="Original Amount" value={fmt(it.original, 2)} />
              <Stat label="Received" value={fmt(it.received, 2)} tone="success" />
              <Stat label="Balance" value={fmt(it.balance, 2)} tone="danger" />
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-2">
              <div className="h-full bg-success" style={{ width: `${it.pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Settlement progress</span>
              <span className="font-medium">Remaining collection: {fmt(it.balance, 2)}</span>
            </div>

            <div className="mt-6 pt-4 border-t border-primary/5">
              <div className="label-kicker text-[9px] mb-2">Payment Timeline</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-success rounded-full" />
                <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">May 30 · $10k</span>
                <div className="flex-1 h-1 bg-warning/50 rounded-full" />
                <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">Expected Jul 25</span>
                <div className="flex-1 h-1 bg-muted rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    <div className="p-3 rounded-lg bg-muted/40">
      <div className="label-kicker text-[9px] mb-1">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : ""}`}>
        {value}
      </div>
    </div>
  );
}

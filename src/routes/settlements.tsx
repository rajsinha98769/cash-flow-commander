import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { fmt } from "@/lib/mock-data";

export const Route = createFileRoute("/settlements")({
  head: () => ({ meta: [{ title: "Client Settlement — CollectFlow" }] }),
  component: Settlement,
});

const rows = [
  { label: "Opening Outstanding", value: 128_400, tone: "" },
  { label: "+ Invoices this cycle", value: 84_200, tone: "brand" },
  { label: "− Payments received", value: -46_500, tone: "success" },
  { label: "− Adjustments", value: -2_100, tone: "muted" },
  { label: "− Credit Notes", value: -4_800, tone: "muted" },
  { label: "− Advance Payments", value: -10_000, tone: "success" },
];

function Settlement() {
  const closing = rows.reduce((s, r) => s + r.value, 0);
  return (
    <AppShell
      title="Client-Level Settlement"
      subtitle="Settle payments at the client level when invoice-wise allocation isn't practical."
    >
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold">Apex Holdings Pvt Ltd</h2>
              <p className="text-xs text-muted-foreground">Settlement cycle: Jun 1 — Jul 16, 2026</p>
            </div>
            <StatusPill tone="warning">Partial Settlement</StatusPill>
          </div>
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between py-3 border-b border-primary/5 last:border-0">
                <span className="text-sm">{r.label}</span>
                <span className={`text-sm font-mono font-semibold tabular-nums ${
                  r.tone === "brand" ? "text-brand" :
                  r.tone === "success" ? "text-success" :
                  r.tone === "muted" ? "text-muted-foreground" : ""
                }`}>{fmt(r.value, 2)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-4 mt-3 rounded-lg bg-primary text-primary-foreground px-4">
              <span className="text-sm font-bold">Remaining Outstanding</span>
              <span className="text-lg font-mono font-bold tabular-nums">{fmt(closing, 2)}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-primary/5">
            <h3 className="font-bold mb-4">Settlement Option</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Full settlement", desc: "Clear all outstanding" },
                { label: "Partial settlement", desc: "Keep balance open", active: true },
                { label: "Future adjustment", desc: "Defer to next cycle" },
                { label: "Keep as advance", desc: "Store credit on account" },
              ].map((o) => (
                <button
                  key={o.label}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    o.active ? "border-brand bg-brand/5" : "border-primary/10 hover:bg-muted"
                  }`}
                >
                  <div className="text-sm font-bold mb-1">{o.label}</div>
                  <div className="text-[11px] text-muted-foreground">{o.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-4">
          <div className="panel p-6">
            <h3 className="font-bold text-sm mb-4">Settlement Summary</h3>
            <div className="space-y-3 text-sm">
              <SumRow label="Opening" value={fmt(128_400, 2)} />
              <SumRow label="Debits" value={fmt(84_200, 2)} tone="brand" />
              <SumRow label="Credits" value={fmt(63_400, 2)} tone="success" />
              <div className="pt-3 border-t border-primary/5">
                <SumRow label="Closing" value={fmt(closing, 2)} bold />
              </div>
            </div>
          </div>
          <button className="w-full h-11 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 shadow-sm">
            Post Settlement
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function SumRow({ label, value, tone, bold }: { label: string; value: string; tone?: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-bold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${tone === "brand" ? "text-brand" : tone === "success" ? "text-success" : ""}`}>{value}</span>
    </div>
  );
}

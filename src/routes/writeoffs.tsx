import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { writeOffs, fmt } from "@/lib/mock-data";

export const Route = createFileRoute("/writeoffs")({
  head: () => ({ meta: [{ title: "Write-off Management — CollectFlow" }] }),
  component: WriteOff,
});

function WriteOff() {
  return (
    <AppShell
      title="Write-off Management"
      subtitle="Invoices proposed for write-off — with reason, approval workflow, and recovery probability."
    >
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { l: "Pending Approval", v: "2", sub: "$15,600" },
          { l: "Approved YTD", v: "8", sub: "$42,300" },
          { l: "Rejected", v: "1", sub: "$4,200" },
          { l: "Recovery Prob Avg", v: "12%", sub: "on pending" },
        ].map((k) => (
          <div key={k.l} className="kpi-card">
            <div className="label-kicker text-[9px] mb-1">{k.l}</div>
            <div className="text-2xl font-bold">{k.v}</div>
            <div className="text-[11px] text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-primary/5 bg-muted/40">
              <th className="p-4 text-left">Invoice</th>
              <th className="p-4 text-left">Client</th>
              <th className="p-4 text-right">Outstanding</th>
              <th className="p-4 text-left">Reason</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Approver</th>
              <th className="p-4 text-right">Recovery Prob</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {writeOffs.map((w) => (
              <tr key={w.id} className="border-b border-primary/5 hover:bg-muted/30">
                <td className="p-4 font-mono text-xs font-semibold">{w.invoice}</td>
                <td className="p-4 font-medium">{w.client}</td>
                <td className="p-4 text-right tabular-nums font-semibold text-danger">{fmt(w.outstanding, 2)}</td>
                <td className="p-4 text-xs max-w-xs">{w.reason}</td>
                <td className="p-4">
                  <StatusPill tone={w.status === "Approved" ? "danger" : "warning"}>{w.status}</StatusPill>
                </td>
                <td className="p-4 text-xs">{w.approver}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${w.recoveryProb > 30 ? "bg-warning" : "bg-danger"}`} style={{ width: `${w.recoveryProb}%` }} />
                    </div>
                    <span className="text-xs font-mono w-8">{w.recoveryProb}%</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  {w.status === "Pending Approval" ? (
                    <div className="inline-flex gap-2 text-xs">
                      <button className="text-success font-semibold hover:underline">Approve</button>
                      <button className="text-danger font-semibold hover:underline">Reject</button>
                    </div>
                  ) : (
                    <button className="text-xs text-muted-foreground hover:text-foreground">View</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel p-6 mt-6">
        <h3 className="font-bold mb-3">Approval History · INV-7712</h3>
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-primary/10" />
          {[
            { at: "2026-06-14", event: "Write-off requested by Sarah Jenkins", tone: "neutral" },
            { at: "2026-06-16", event: "Approved by Finance Manager", tone: "brand" },
            { at: "2026-06-18", event: "Final approval by CFO", tone: "success" },
            { at: "2026-06-18", event: "Amount $18,400 written off to bad debt", tone: "danger" },
          ].map((t, i) => (
            <div key={i} className="relative">
              <div className={`absolute -left-[18px] top-1.5 size-3 rounded-full ring-4 ${
                t.tone === "success" ? "bg-success ring-success/15" :
                t.tone === "danger" ? "bg-danger ring-danger/15" :
                t.tone === "brand" ? "bg-brand ring-brand/15" : "bg-muted-foreground ring-muted"
              }`} />
              <div className="flex justify-between text-sm">
                <span>{t.event}</span>
                <span className="text-xs text-muted-foreground">{t.at}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

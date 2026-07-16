import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { disputes, fmt } from "@/lib/mock-data";
import { FileText, Paperclip } from "lucide-react";

export const Route = createFileRoute("/disputes")({
  head: () => ({ meta: [{ title: "Disputed Invoices — CollectFlow" }] }),
  component: Disputes,
});

function Disputes() {
  return (
    <AppShell title="Disputed Invoices" subtitle="Track invoices under dispute — reason, ownership, and expected resolution.">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { l: "Open Disputes", v: "9", sub: "$168,000" },
          { l: "Avg Age", v: "22d", sub: "Oldest 62d" },
          { l: "Resolution Rate", v: "68%", sub: "Last 90d" },
          { l: "In Legal Review", v: "2", sub: "$50,900" },
        ].map((k) => (
          <div key={k.l} className="kpi-card">
            <div className="label-kicker text-[9px] mb-1">{k.l}</div>
            <div className="text-2xl font-bold">{k.v}</div>
            <div className="text-[11px] text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {disputes.map((d) => (
          <div key={d.id} className="panel p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-mono text-xs font-semibold">{d.invoice}</div>
                <div className="text-sm font-bold">{d.client}</div>
              </div>
              <StatusPill tone={d.status === "Legal Review" ? "danger" : "warning"}>{d.status}</StatusPill>
            </div>
            <div className="text-xs text-muted-foreground mb-4 italic">"{d.reason}"</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <div className="label-kicker text-[9px]">Owner</div>
                <div className="text-sm font-semibold">{d.owner}</div>
              </div>
              <div>
                <div className="label-kicker text-[9px]">Expected</div>
                <div className="text-sm font-semibold">{d.expected}</div>
              </div>
              <div>
                <div className="label-kicker text-[9px]">Raised</div>
                <div className="text-sm">{d.raisedOn}</div>
              </div>
              <div>
                <div className="label-kicker text-[9px]">Outstanding</div>
                <div className="text-sm font-bold text-danger">{fmt(d.outstanding, 2)}</div>
              </div>
            </div>
            <div className="mb-4">
              <div className="label-kicker text-[9px] mb-2">Timeline</div>
              <div className="flex gap-1">
                <div className="flex-1 h-1 bg-brand rounded-full" />
                <div className="flex-1 h-1 bg-warning rounded-full" />
                <div className="flex-1 h-1 bg-muted rounded-full" />
                <div className="flex-1 h-1 bg-muted rounded-full" />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                <span>Raised</span>
                <span>Review</span>
                <span>Resolved</span>
              </div>
            </div>
            <div className="pt-3 border-t border-primary/5 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <Paperclip className="size-3" /> 3 documents
              </span>
              <button className="text-brand font-semibold hover:underline inline-flex items-center gap-1">
                <FileText className="size-3" /> View case
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

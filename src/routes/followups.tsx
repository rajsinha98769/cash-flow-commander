import { createFileRoute } from "@tanstack/react-router";
import { AppShell, RiskDot } from "@/components/app-shell";
import { kanbanColumns, kanbanCards, fmt } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/followups")({
  head: () => ({ meta: [{ title: "Follow-up Board — CollectFlow" }] }),
  component: Board,
});

function Board() {
  return (
    <AppShell
      title="Follow-up Board"
      subtitle="Kanban view of the collection pipeline — from new invoices to legal escalation."
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-8 px-8">
        {kanbanColumns.map((col) => {
          const cards = kanbanCards[col.id] ?? [];
          return (
            <div key={col.id} className="min-w-[280px] w-72 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${col.accent}`} />
                  <h3 className="font-bold text-sm">{col.title}</h3>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                    {cards.length}
                  </span>
                </div>
                <button className="size-6 rounded grid place-items-center hover:bg-muted text-muted-foreground">
                  <Plus className="size-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                {cards.map((c) => (
                  <div key={c.id} className="panel p-3 hover:border-brand/30 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-sm truncate flex-1">{c.client}</div>
                      <RiskDot risk={c.risk} />
                    </div>
                    <div className="text-base font-bold tabular-nums mb-2">{fmt(c.outstanding)}</div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{c.collector}</span>
                      <span className="font-medium text-brand">{c.nextFollowup}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">Last contact: {c.lastContact}</div>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div className="text-[11px] text-muted-foreground text-center py-6 border border-dashed border-primary/10 rounded-lg">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

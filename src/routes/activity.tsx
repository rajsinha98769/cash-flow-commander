import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { activityFeed } from "@/lib/mock-data";
import { Phone, MessageSquare, Mail, Users, Calendar, AlertOctagon, BanknoteArrowUp, StickyNote, ShieldAlert, FileX } from "lucide-react";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Collection Activity Timeline — CollectFlow" }] }),
  component: ActivityPage,
});

const typeMap: Record<string, { icon: any; tone: string; label: string }> = {
  payment: { icon: BanknoteArrowUp, tone: "success", label: "Payment" },
  ptp: { icon: Calendar, tone: "warning", label: "Promise to Pay" },
  "broken-ptp": { icon: ShieldAlert, tone: "danger", label: "Broken Promise" },
  call: { icon: Phone, tone: "brand", label: "Call" },
  email: { icon: Mail, tone: "neutral", label: "Email" },
  dispute: { icon: AlertOctagon, tone: "warning", label: "Dispute" },
  escalation: { icon: ShieldAlert, tone: "danger", label: "Escalation" },
  whatsapp: { icon: MessageSquare, tone: "success", label: "WhatsApp" },
  sms: { icon: MessageSquare, tone: "neutral", label: "SMS" },
  meeting: { icon: Users, tone: "brand", label: "Meeting" },
  note: { icon: StickyNote, tone: "neutral", label: "Note" },
  writeoff: { icon: FileX, tone: "danger", label: "Write-off" },
};

const extended = [
  ...activityFeed,
  { id: "a-8", type: "whatsapp", client: "Nordic Textile", text: "WhatsApp reminder delivered — read at 11:42", at: "3 days ago", collector: "Daniel Kim" },
  { id: "a-9", type: "meeting", client: "Apex Holdings", text: "In-person reconciliation meeting — commitments logged", at: "4 days ago", collector: "Sarah Jenkins" },
  { id: "a-10", type: "note", client: "Veritas Medical", text: "Internal note: Client CFO on leave until 21 Jul", at: "5 days ago", collector: "Mike Ross" },
  { id: "a-11", type: "sms", client: "Meridian Consulting", text: "SMS with payment link sent", at: "1 week ago", collector: "Ava Thompson" },
  { id: "a-12", type: "writeoff", client: "Silverline Traders", text: "Write-off approved by CFO — $18,400", at: "1 week ago", collector: "System" },
];

function ActivityPage() {
  return (
    <AppShell
      title="Collection Activity Timeline"
      subtitle="Every touchpoint — calls, messages, meetings, promises, disputes, and settlements — in chronological order."
    >
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <StatusPill tone="brand">All activities</StatusPill>
        {Object.values(typeMap).slice(0, 8).map((t) => (
          <button key={t.label} className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors inline-flex items-center gap-1.5">
            <t.icon className="size-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="panel p-6">
        <div className="relative pl-8 space-y-6">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-primary/10" />
          {extended.map((a) => {
            const m = typeMap[a.type] ?? typeMap.note;
            const Icon = m.icon;
            return (
              <div key={a.id} className="relative">
                <div className={`absolute -left-[26px] top-0 size-7 rounded-full grid place-items-center ring-4 ring-background ${
                  m.tone === "success" ? "bg-success text-white" :
                  m.tone === "warning" ? "bg-warning text-white" :
                  m.tone === "danger" ? "bg-danger text-white" :
                  m.tone === "brand" ? "bg-brand text-brand-foreground" :
                  "bg-muted text-foreground"
                }`}>
                  <Icon className="size-3.5" />
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusPill tone={m.tone as any}>{m.label}</StatusPill>
                      <span className="font-semibold text-sm">{a.client}</span>
                    </div>
                    <div className="text-sm text-foreground/90">{a.text}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{a.collector}</div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{a.at}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

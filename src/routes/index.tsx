import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Upload, BanknoteArrowUp, CalendarPlus, BookUser } from "lucide-react";
import { AppShell, RiskDot, StatusPill } from "@/components/app-shell";
import {
  dashboardKpis,
  outstandingTrend,
  agingBuckets,
  collectorPerformance,
  clients,
  followups,
  activityFeed,
  fmt,
  fmtCompact,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Collections Dashboard — CollectFlow" },
      { name: "description", content: "Real-time A/R status: outstanding, collection rate, aging distribution, top overdue clients, and today's follow-ups." },
    ],
  }),
  component: Dashboard,
});

const kpis = [
  { label: "Total Outstanding", value: fmt(dashboardKpis.totalOutstanding), delta: "+12%", trend: "up" as const, sub: "vs last month" },
  { label: "Total Receivable", value: fmt(dashboardKpis.totalReceivable), delta: "", trend: "up" as const, sub: "gross book value" },
  { label: "Collected MTD", value: fmt(dashboardKpis.collectedMTD), delta: "+8%", trend: "up" as const, sub: "Target: $800k", tone: "success" as const },
  { label: "Pending Collection", value: fmt(dashboardKpis.pendingCollection), delta: "", trend: "up" as const, sub: `${dashboardKpis.overdueInvoices} overdue invoices` },
  { label: "Overdue > 60 Days", value: fmt(dashboardKpis.overdue), delta: "+3%", trend: "up" as const, sub: "32 high-risk invoices", tone: "danger" as const },
  { label: "Bad Debt / Written Off", value: fmt(dashboardKpis.writtenOff), delta: "-2%", trend: "down" as const, sub: "YTD" },
  { label: "Collection Rate", value: `${dashboardKpis.collectionRate}%`, delta: "+1.2pt", trend: "up" as const, sub: "6-month rolling", bar: dashboardKpis.collectionRate },
  { label: "Avg Collection Days", value: `${dashboardKpis.avgCollectionDays}d`, delta: "-4d", trend: "down" as const, sub: "vs Q1" },
  { label: "Clients w/ Outstanding", value: `${dashboardKpis.clientsOutstanding}`, delta: "", trend: "up" as const, sub: "18 new this month" },
  { label: "Overdue Invoices", value: `${dashboardKpis.overdueInvoices}`, delta: "+4", trend: "up" as const, sub: "3 critical", tone: "warning" as const },
];

function Dashboard() {
  return (
    <AppShell
      title="Collections Overview"
      subtitle="Real-time receivables status, recovery pipeline, and today's priority workload."
    >
      {/* KPI ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="label-kicker mb-1">{k.label}</div>
            <div
              className={[
                "text-xl font-bold tabular-nums",
                k.tone === "danger" && "text-danger",
                k.tone === "success" && "text-success",
                k.tone === "warning" && "text-warning",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {k.value}
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              {k.delta ? (
                <span
                  className={`flex items-center gap-0.5 px-1 rounded font-medium ${
                    k.trend === "up" ? "bg-success/10 text-success" : "bg-muted text-foreground"
                  }`}
                >
                  {k.trend === "up" ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {k.delta}
                </span>
              ) : null}
              <span>{k.sub}</span>
            </div>
            {k.bar !== undefined ? (
              <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-brand" style={{ width: `${k.bar}%` }} />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { icon: Upload, label: "Upload Invoice", to: "/inbox" },
          { icon: BanknoteArrowUp, label: "Record Payment", to: "/payments/new" },
          { icon: CalendarPlus, label: "Create Follow-up", to: "/followups" },
          { icon: BookUser, label: "View Client Ledger", to: "/clients" },
        ].map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="panel px-4 py-3 flex items-center gap-3 hover:border-brand/30 transition-colors group"
          >
            <div className="size-9 rounded-lg bg-brand/10 text-brand grid place-items-center group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
              <a.icon className="size-4" />
            </div>
            <span className="text-sm font-semibold">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Trend */}
        <div className="col-span-12 xl:col-span-8 panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold">Outstanding vs Collection Trend</h2>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-brand" /> Outstanding
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" /> Collected
              </span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={outstandingTrend}>
                <defs>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v)} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => fmt(v)}
                />
                <Area type="monotone" dataKey="outstanding" stroke="var(--brand)" strokeWidth={2} fill="url(#gOut)" />
                <Area type="monotone" dataKey="collected" stroke="var(--success)" strokeWidth={2} fill="url(#gCol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aging distribution card */}
        <div className="col-span-12 xl:col-span-4 panel p-6 bg-primary text-primary-foreground">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-sm">Aging Distribution</h3>
              <p className="text-[10px] opacity-60">Outstanding by bucket</p>
            </div>
            <Link to="/aging" className="text-[10px] font-medium underline decoration-dotted opacity-80 hover:opacity-100">
              Full report
            </Link>
          </div>
          <div className="space-y-3">
            {agingBuckets.map((b, i) => {
              const total = agingBuckets.reduce((s, x) => s + x.amount, 0);
              const pct = (b.amount / total) * 100;
              const tone = i < 2 ? "bg-success" : i < 4 ? "bg-warning" : "bg-danger";
              return (
                <div key={b.bucket}>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="opacity-70">{b.bucket}</span>
                    <span className="font-mono">{fmtCompact(b.amount)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${tone}`} style={{ width: `${Math.max(pct, 3)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top overdue */}
        <div className="col-span-12 xl:col-span-8 panel">
          <div className="p-6 border-b border-primary/5 flex justify-between items-center">
            <div>
              <h2 className="font-bold">Top Overdue Clients</h2>
              <p className="text-xs text-muted-foreground">Sorted by outstanding amount</p>
            </div>
            <div className="flex gap-2">
              <StatusPill tone="neutral">Pending (12)</StatusPill>
              <StatusPill tone="warning">Follow-up (5)</StatusPill>
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-primary/5 bg-muted/40">
                <th className="p-4 font-semibold">Client</th>
                <th className="p-4 font-semibold text-right">Outstanding</th>
                <th className="p-4 font-semibold">Oldest Invoice</th>
                <th className="p-4 font-semibold text-center">Risk</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {clients.slice(0, 6).map((c) => (
                <tr key={c.id} className="border-b border-primary/5 hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">Collector: {c.collector}</div>
                  </td>
                  <td className="p-4 text-right font-medium tabular-nums">{fmt(c.outstanding, 2)}</td>
                  <td className="p-4">
                    <div>{c.oldestInvoice}</div>
                    <div className={`text-[11px] ${c.oldestInvoiceDays > 30 ? "text-danger" : c.oldestInvoiceDays > 0 ? "text-warning" : "text-muted-foreground"}`}>
                      {c.oldestInvoiceDays > 0 ? `${c.oldestInvoiceDays} days overdue` : "Current"}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <RiskDot risk={c.risk} />
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to="/clients/$id"
                      params={{ id: c.id }}
                      className="text-brand font-semibold text-xs hover:underline"
                    >
                      View 360
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upcoming follow-ups */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="panel p-6">
            <h3 className="font-bold mb-4 flex items-center justify-between">
              Upcoming Follow-ups
              <StatusPill>Today</StatusPill>
            </h3>
            <div className="space-y-4">
              {followups.slice(0, 4).map((f) => (
                <div key={f.id} className="flex gap-3">
                  <div className={`flex-none w-1 rounded-full ${f.risk === "critical" ? "bg-danger" : f.risk === "high" ? "bg-warning" : "bg-brand"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate">{f.client}</div>
                    <div className="text-[10px] text-muted-foreground mb-1 truncate">{f.note}</div>
                    <div className="text-[10px] text-brand font-medium">{f.when}</div>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {fmtCompact(f.outstanding)}
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/followups"
              className="mt-6 w-full inline-flex items-center justify-center py-2 text-xs font-bold border border-primary/10 rounded-lg hover:bg-muted transition-colors"
            >
              View Board
            </Link>
          </div>

          {/* Recent activity */}
          <div className="panel p-6">
            <h3 className="font-bold mb-4 text-sm">Recent Activity</h3>
            <div className="space-y-4">
              {activityFeed.slice(0, 4).map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className={`size-2 rounded-full mt-1.5 shrink-0 ${
                    a.type === "payment" ? "bg-success" :
                    a.type === "ptp" ? "bg-warning" :
                    a.type === "broken-ptp" || a.type === "escalation" ? "bg-danger" :
                    "bg-muted-foreground"
                  }`} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{a.text}</div>
                    <div className="text-[10px] text-muted-foreground">{a.client} • {a.at}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collector performance */}
        <div className="col-span-12 panel p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold">Collection by Collector</h2>
              <p className="text-xs text-muted-foreground">Month-to-date recovery vs target</p>
            </div>
            <Link to="/reports" className="text-xs text-brand font-semibold hover:underline">
              View performance report →
            </Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectorPerformance} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v)} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => fmt(v)}
                />
                <Bar dataKey="target" fill="var(--muted)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="collected" fill="var(--brand)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

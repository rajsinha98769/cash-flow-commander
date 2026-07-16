import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Inbox,
  Users,
  ListChecks,
  ReceiptText,
  BanknoteArrowUp,
  SplitSquareHorizontal,
  Handshake,
  PieChart,
  KanbanSquare,
  Briefcase,
  BarChart3,
  FileWarning,
  AlertOctagon,
  FileText,
  LineChart,
  Activity,
  Search,
  Bell,
  Plus,
} from "lucide-react";
import type { ReactNode } from "react";

const nav: Array<{
  section: string;
  items: Array<{ to: string; label: string; icon: typeof LayoutDashboard }>;
}> = [
  {
    section: "Collections",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/inbox", label: "Invoice Inbox", icon: Inbox },
      { to: "/clients", label: "Clients Receivable", icon: Users },
      { to: "/followups", label: "Follow-up Board", icon: KanbanSquare },
      { to: "/activity", label: "Activity Timeline", icon: Activity },
    ],
  },
  {
    section: "Operations",
    items: [
      { to: "/payments/new", label: "Record Payment", icon: BanknoteArrowUp },
      { to: "/payments/allocate", label: "Payment Allocation", icon: SplitSquareHorizontal },
      { to: "/settlements", label: "Client Settlement", icon: Handshake },
      { to: "/settlements/partial", label: "Partial Settlement", icon: ListChecks },
      { to: "/disputes", label: "Disputes", icon: AlertOctagon },
      { to: "/writeoffs", label: "Write-offs", icon: FileWarning },
    ],
  },
  {
    section: "Intelligence",
    items: [
      { to: "/aging", label: "Aging Analysis", icon: PieChart },
      { to: "/workspace", label: "Collector Workspace", icon: Briefcase },
      { to: "/reports", label: "Reports", icon: BarChart3 },
      { to: "/analytics", label: "Analytics", icon: LineChart },
      { to: "/statement", label: "Client Statement", icon: FileText },
    ],
  },
];

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="flex min-h-screen bg-surface text-foreground font-sans">
      <aside className="w-64 border-r border-primary/5 bg-card flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-primary/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 bg-brand rounded-lg flex items-center justify-center text-brand-foreground font-bold shadow-sm">
              C
            </div>
            <div className="leading-tight">
              <div className="font-bold tracking-tight">CollectFlow</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                A/R & Collections
              </div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {nav.map((group) => (
            <div key={group.section}>
              <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                {group.section}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    item.to === "/"
                      ? pathname === "/"
                      : pathname === item.to || pathname.startsWith(item.to + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={[
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                        active
                          ? "bg-brand/5 text-brand font-medium"
                          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                      ].join(" ")}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-primary/5">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors">
            <div className="size-8 rounded-full bg-brand/10 text-brand grid place-items-center text-xs font-bold">
              SJ
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold">Sarah Jenkins</div>
              <div className="text-[10px] text-muted-foreground">Senior Collector</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-10 bg-surface/85 backdrop-blur border-b border-primary/5">
          <div className="flex items-center justify-between px-8 py-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary text-balance">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-muted-foreground text-sm mt-0.5 text-pretty">{subtitle}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg border border-primary/10 bg-card text-sm text-muted-foreground w-64">
                <Search className="size-4" />
                <span>Search clients, invoices…</span>
                <kbd className="ml-auto text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
                  ⌘K
                </kbd>
              </div>
              <button className="size-9 rounded-lg border border-primary/10 bg-card grid place-items-center hover:bg-muted transition-colors">
                <Bell className="size-4" />
              </button>
              {actions ?? (
                <>
                  <Link
                    to="/inbox"
                    className="px-4 h-9 inline-flex items-center rounded-lg bg-card border border-primary/10 text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    Upload Invoices
                  </Link>
                  <Link
                    to="/payments/new"
                    className="px-4 h-9 inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 transition-colors shadow-sm"
                  >
                    <Plus className="size-4" /> Record Payment
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  );
}

export function RiskDot({ risk }: { risk: "low" | "medium" | "high" | "critical" }) {
  const map = {
    low: "bg-success",
    medium: "bg-warning",
    high: "bg-warning",
    critical: "bg-danger",
  } as const;
  return <span className={`size-2 inline-block rounded-full ${map[risk]}`} />;
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "brand" }) {
  const styles = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/10 text-danger",
    brand: "bg-brand/10 text-brand",
  } as const;
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${styles[tone]}`}>
      {children}
    </span>
  );
}

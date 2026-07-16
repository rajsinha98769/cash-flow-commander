import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Users, LogOut, ShieldCheck, Eye } from "lucide-react";
import type { ReactNode } from "react";
import { me, logout } from "@/lib/api/auth";
import type { User } from "@/lib/types";

// MVP navigation. Additional Lovable screens (inbox, follow-ups, aging,
// analytics, disputes, etc.) still exist as route files but are intentionally
// hidden from the sidebar until they are wired to live data.
const nav: Array<{ to: string; label: string; icon: typeof LayoutDashboard }> = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
];

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => me(), staleTime: 60_000 });
}

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
  const { data: user } = useMe();

  return (
    <div className="flex min-h-screen bg-surface text-foreground font-sans">
      <aside className="w-60 border-r border-primary/5 bg-card flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-primary/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 bg-brand rounded-lg flex items-center justify-center text-brand-foreground font-bold shadow-sm">
              C
            </div>
            <div className="leading-tight">
              <div className="font-bold tracking-tight">CollectFlow</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                A/R &amp; Collections
              </div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {nav.map((item) => {
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
        </nav>
        <UserFooter user={user} />
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-10 bg-surface/85 backdrop-blur border-b border-primary/5">
          <div className="flex items-center justify-between px-8 py-5 gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-primary text-balance truncate">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-muted-foreground text-sm mt-0.5 text-pretty">{subtitle}</p>
              ) : null}
            </div>
            {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
          </div>
        </header>
        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  );
}

function UserFooter({ user }: { user: User | null | undefined }) {
  const router = useRouter();
  const qc = useQueryClient();
  const logoutMut = useMutation({
    mutationFn: () => logout(),
    onSuccess: async () => {
      await qc.clear();
      await router.invalidate();
      router.navigate({ href: "/login" });
    },
  });
  const initials = (user?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="p-3 border-t border-primary/5">
      <div className="flex items-center gap-3 p-2 rounded-lg">
        <div className="size-8 rounded-full bg-brand/10 text-brand grid place-items-center text-xs font-bold uppercase">
          {initials}
        </div>
        <div className="leading-tight min-w-0 flex-1">
          <div className="text-xs font-semibold truncate">{user?.name ?? "—"}</div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 capitalize">
            {user?.role === "manager" ? (
              <ShieldCheck className="size-3" />
            ) : (
              <Eye className="size-3" />
            )}
            {user?.role ?? ""}
          </div>
        </div>
        <button
          onClick={() => logoutMut.mutate()}
          title="Sign out"
          className="size-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-primary/5 hover:text-danger transition-colors"
        >
          <LogOut className="size-4" />
        </button>
      </div>
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

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
}) {
  const styles = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/10 text-danger",
    brand: "bg-brand/10 text-brand",
  } as const;
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

/** Maps an invoice status to a StatusPill tone. */
export function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "brand" {
  switch (status) {
    case "paid":
      return "success";
    case "partial":
      return "brand";
    case "overdue":
      return "danger";
    case "written-off":
      return "warning";
    default:
      return "neutral";
  }
}

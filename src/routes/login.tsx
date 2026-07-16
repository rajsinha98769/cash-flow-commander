import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { login } from "@/lib/api/auth";
import { LogIn } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Sign in — CollectFlow" }] }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: (vars: { username: string; password: string }) => login({ data: vars }),
    onSuccess: async () => {
      await router.invalidate();
      router.navigate({ href: redirect ?? "/" });
    },
  });

  return (
    <div className="min-h-screen grid place-items-center bg-surface text-foreground font-sans px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="size-9 bg-brand rounded-lg grid place-items-center text-brand-foreground font-bold shadow-sm">
            C
          </div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight text-lg">CollectFlow</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
              A/R &amp; Collections
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({ username, password });
          }}
          className="panel p-6 space-y-4"
        >
          <div>
            <h1 className="text-lg font-bold">Sign in</h1>
            <p className="text-sm text-muted-foreground">Use your CollectFlow account.</p>
          </div>

          <div>
            <label className="label-kicker text-[10px] block mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              className="w-full h-10 px-3 rounded-lg border border-primary/10 bg-card text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="label-kicker text-[10px] block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full h-10 px-3 rounded-lg border border-primary/10 bg-card text-sm outline-none focus:border-brand"
            />
          </div>

          {mutation.isError ? (
            <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
              {(mutation.error as Error).message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-10 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <LogIn className="size-4" /> {mutation.isPending ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            Seeded logins — <span className="font-mono">admin / admin123</span> ·{" "}
            <span className="font-mono">viewer / viewer123</span>
          </p>
        </form>
      </div>
    </div>
  );
}

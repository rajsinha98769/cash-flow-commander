import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { AppShell, StatusPill, useMe } from "@/components/app-shell";
import { Modal, Field, inputCls, textareaCls } from "@/components/modal";
import { InvoiceForm } from "@/components/invoice-form";
import {
  listClients,
  createClient,
  updateClient,
  setClientEnabled,
  deleteClient,
} from "@/lib/api/clients";
import { fmt } from "@/lib/derive";
import type { ClientWithSummary } from "@/lib/types";
import { Search, Plus, Pencil, Power, Trash2, FilePlus2, BanknoteArrowUp, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/clients/")({
  validateSearch: (s: Record<string, unknown>): { new?: boolean } =>
    s.new === "1" || s.new === true ? { new: true } : {},
  head: () => ({ meta: [{ title: "Clients — CollectFlow" }] }),
  component: ClientsList,
});

type FormState = {
  id?: string;
  name: string;
  region: string;
  contact: string;
  email: string;
  phone: string;
  notes: string;
  enabled: boolean;
};

const empty: FormState = {
  name: "",
  region: "",
  contact: "",
  email: "",
  phone: "",
  notes: "",
  enabled: true,
};

function ClientsList() {
  const qc = useQueryClient();
  const { data: user } = useMe();
  const canEdit = user?.role === "manager";
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => listClients(),
  });

  const [search, setSearch] = useState("");
  const [showDisabled, setShowDisabled] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Deep-link: /clients?new=1 opens the Add Client form (used by the dashboard link).
  const routeSearch = Route.useSearch();
  const navigate = Route.useNavigate();
  useEffect(() => {
    if (canEdit && routeSearch.new) {
      setForm({ ...empty });
      navigate({ search: {}, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSearch.new, canEdit]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients
      .filter((c) => showDisabled || c.enabled)
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.contact.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q),
      );
  }, [clients, search, showDisabled]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const saveMut = useMutation({
    mutationFn: (f: FormState) => {
      const payload = {
        name: f.name,
        region: f.region,
        contact: f.contact,
        email: f.email,
        phone: f.phone,
        notes: f.notes,
        enabled: f.enabled,
      };
      return f.id
        ? updateClient({ data: { id: f.id, ...payload } })
        : createClient({ data: payload });
    },
    onSuccess: () => {
      invalidate();
      setForm(null);
    },
  });

  const toggleMut = useMutation({
    mutationFn: (c: ClientWithSummary) => setClientEnabled({ data: { id: c.id, enabled: !c.enabled } }),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteClient({ data: { id } }),
    onSuccess: invalidate,
  });

  return (
    <AppShell
      title="Clients"
      subtitle="Manage clients and their receivables."
      actions={
        canEdit ? (
          <>
            <button
              onClick={() => setUploadOpen(true)}
              className="px-3 h-9 inline-flex items-center gap-1.5 rounded-lg border border-primary/10 bg-card text-sm font-semibold hover:bg-muted transition-colors"
            >
              <FilePlus2 className="size-4" /> Upload Invoice
            </button>
            <button
              onClick={() => setForm({ ...empty })}
              className="px-4 h-9 inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 transition-colors shadow-sm"
            >
              <Plus className="size-4" /> Add Client
            </button>
          </>
        ) : null
      }
    >
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 h-9 rounded-lg border border-primary/10 bg-card text-sm w-72">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, contact, region…"
            className="bg-transparent outline-none flex-1 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showDisabled}
            onChange={(e) => setShowDisabled(e.target.checked)}
          />
          Show disabled
        </label>
        <div className="ml-auto text-sm text-muted-foreground">
          {filtered.length} client{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="panel p-10 text-center text-sm text-muted-foreground">
          No clients yet. {canEdit ? "Click “Add Client” to create one." : ""}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className={`panel p-5 transition-all group ${c.enabled ? "hover:border-brand/30 hover:shadow-md" : "opacity-70"}`}
            >
              <div className="flex items-start justify-between mb-4 gap-2">
                <Link to="/clients/$id" params={{ id: c.id }} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      {c.region || "—"}
                    </span>
                  </div>
                  <h3 className="font-bold text-base truncate group-hover:text-brand transition-colors">
                    {c.name}
                  </h3>
                </Link>
                <StatusPill tone={c.enabled ? "success" : "neutral"}>
                  {c.enabled ? "active" : "disabled"}
                </StatusPill>
              </div>

              <Link to="/clients/$id" params={{ id: c.id }} className="block">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="label-kicker text-[9px]">Outstanding</div>
                    <div className="text-lg font-bold tabular-nums">{fmt(c.summary.outstanding, 2)}</div>
                  </div>
                  <div>
                    <div className="label-kicker text-[9px]">Overdue</div>
                    <div
                      className={`text-lg font-bold tabular-nums ${c.summary.overdue > 0 ? "text-danger" : "text-muted-foreground"}`}
                    >
                      {fmt(c.summary.overdue, 2)}
                    </div>
                  </div>
                  <div>
                    <div className="label-kicker text-[9px]">Invoices</div>
                    <div className="text-sm font-semibold">
                      {c.summary.invoiceCount}
                      {c.summary.proformaCount > 0 ? (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          +{c.summary.proformaCount} proforma
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <div className="label-kicker text-[9px]">Advance</div>
                    <div className="text-sm font-semibold text-success">
                      {fmt(c.summary.advance, 2)}
                    </div>
                  </div>
                </div>
              </Link>

              <div className="pt-4 border-t border-primary/5 space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="text-muted-foreground truncate">{c.contact || "No contact"}</div>
                  {canEdit ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="Edit client"
                        onClick={() =>
                          setForm({
                            id: c.id,
                            name: c.name,
                            region: c.region,
                            contact: c.contact,
                            email: c.email,
                            phone: c.phone,
                            notes: c.notes,
                            enabled: c.enabled,
                          })
                        }
                        className="size-7 grid place-items-center rounded-md hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        title={c.enabled ? "Disable" : "Enable"}
                        onClick={() => toggleMut.mutate(c)}
                        className="size-7 grid place-items-center rounded-md hover:bg-primary/5 text-muted-foreground hover:text-warning"
                      >
                        <Power className="size-3.5" />
                      </button>
                      <button
                        title="Delete client"
                        onClick={() => {
                          if (
                            confirm(
                              `Delete ${c.name}? This removes the client and all its invoices and payments.`,
                            )
                          )
                            deleteMut.mutate(c.id);
                        }}
                        className="size-7 grid place-items-center rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {canEdit ? (
                    <>
                      <Link
                        to="/clients/$id"
                        params={{ id: c.id }}
                        search={{ action: "invoice" }}
                        className="flex-1 h-8 rounded-md bg-brand/10 text-brand text-xs font-semibold inline-flex items-center justify-center gap-1 hover:bg-brand/20"
                      >
                        <FilePlus2 className="size-3.5" /> Add Invoice
                      </Link>
                      <Link
                        to="/clients/$id"
                        params={{ id: c.id }}
                        search={{ action: "payment" }}
                        className="flex-1 h-8 rounded-md border border-primary/10 text-xs font-semibold inline-flex items-center justify-center gap-1 hover:bg-muted"
                      >
                        <BanknoteArrowUp className="size-3.5" /> Payment
                      </Link>
                    </>
                  ) : null}
                  <Link
                    to="/clients/$id"
                    params={{ id: c.id }}
                    className="h-8 px-3 rounded-md border border-primary/10 text-xs font-semibold inline-flex items-center justify-center gap-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    Open <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit Client" : "Add Client"}
        subtitle="Client master details"
      >
        {form ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMut.mutate(form);
            }}
            className="space-y-4"
          >
            <Field label="Name *">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Region">
                <input
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Contact person">
                <input
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Phone">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={textareaCls}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              Active (enabled)
            </label>

            {saveMut.isError ? (
              <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
                {(saveMut.error as Error).message}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="h-9 px-4 rounded-lg border border-primary/10 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMut.isPending}
                className="h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 disabled:opacity-60"
              >
                {saveMut.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      {uploadOpen ? (
        <InvoiceForm
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          open
          onClose={() => setUploadOpen(false)}
        />
      ) : null}
    </AppShell>
  );
}

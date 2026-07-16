import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Modal, Field, inputCls, textareaCls } from "@/components/modal";
import { createInvoice, updateInvoice } from "@/lib/api/invoices";
import { fmt, todayISO } from "@/lib/derive";
import type { InvoiceView } from "@/lib/types";
import { FileText, Paperclip } from "lucide-react";

/**
 * Add or edit an invoice/proforma for a client, with optional file upload.
 * When `clientId` is omitted, a client picker is shown (global "Upload Invoice"
 * flow); pass `clients` to populate it.
 */
export function InvoiceForm({
  clientId,
  clients,
  invoice,
  open,
  onClose,
}: {
  clientId?: string;
  clients?: Array<{ id: string; name: string }>;
  invoice?: InvoiceView | null;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const editing = !!invoice;
  const needsClientPicker = !clientId && !editing;

  const [selectedClient, setSelectedClient] = useState(clientId ?? "");
  const [number, setNumber] = useState(invoice?.number ?? "");
  const [isProforma, setIsProforma] = useState(invoice?.isProforma ?? false);
  const [invoiceDate, setInvoiceDate] = useState(invoice?.invoiceDate ?? todayISO());
  const [dueDate, setDueDate] = useState(invoice?.dueDate ?? todayISO());
  const [amount, setAmount] = useState(invoice ? String(invoice.amount) : "");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [file, setFile] = useState<File | null>(null);

  const effectiveClientId = clientId ?? selectedClient;

  const mutation = useMutation({
    mutationFn: () => {
      if (!effectiveClientId) throw new Error("Please select a client");
      const fd = new FormData();
      if (editing) fd.set("id", invoice!.id);
      fd.set("clientId", effectiveClientId);
      fd.set("number", number);
      fd.set("isProforma", isProforma ? "true" : "false");
      fd.set("invoiceDate", invoiceDate);
      fd.set("dueDate", dueDate);
      fd.set("amount", amount || "0");
      fd.set("notes", notes);
      if (file) fd.set("file", file);
      return editing ? updateInvoice({ data: fd }) : createInvoice({ data: fd });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", effectiveClientId] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Entry" : "Add Invoice / Proforma"}
      subtitle={isProforma ? "Proforma — not yet a tax invoice" : "Tax invoice"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div className="flex gap-2 p-1 rounded-lg bg-muted">
          <button
            type="button"
            onClick={() => setIsProforma(false)}
            className={`flex-1 h-9 rounded-md text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${!isProforma ? "bg-card shadow-sm text-brand" : "text-muted-foreground"}`}
          >
            <FileText className="size-4" /> Invoice
          </button>
          <button
            type="button"
            onClick={() => setIsProforma(true)}
            className={`flex-1 h-9 rounded-md text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${isProforma ? "bg-card shadow-sm text-warning" : "text-muted-foreground"}`}
          >
            <FileText className="size-4" /> Proforma
          </button>
        </div>

        {needsClientPicker ? (
          <Field label="Client *">
            <select
              required
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className={inputCls}
            >
              <option value="">Select a client…</option>
              {(clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <Field label={isProforma ? "Proforma number" : "Invoice number *"}>
            <input
              required={!isProforma}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className={inputCls}
              placeholder={isProforma ? "PRO-0001" : "INV-0001"}
            />
          </Field>
          <Field label="Amount (₹) *">
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={isProforma ? "Proforma date" : "Invoice date"}>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaCls} />
        </Field>

        <Field
          label={`Attachment (PDF/image)${editing && invoice?.fileName ? " — replaces current" : ""}`}
          hint={
            editing && invoice?.fileName ? (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="size-3" /> Current: {invoice.fileName}
              </span>
            ) : null
          }
        >
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm file:mr-3 file:h-9 file:px-3 file:rounded-lg file:border-0 file:bg-muted file:text-sm file:font-semibold"
          />
        </Field>

        {amount ? (
          <div className="text-sm text-muted-foreground">
            Entry amount:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {fmt(Number(amount) || 0, 2)}
            </span>
          </div>
        ) : null}

        {mutation.isError ? (
          <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            {(mutation.error as Error).message}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-primary/10 text-sm font-semibold hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 disabled:opacity-60"
          >
            {mutation.isPending ? "Saving…" : editing ? "Save changes" : "Add entry"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

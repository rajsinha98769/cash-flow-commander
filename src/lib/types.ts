// Domain model for the A/R & Collections MVP.
// These types are shared by client and server code — keep them free of any
// server-only imports (no mongodb, no fs).

export type ClientStatus = "active" | "disabled";

export interface Client {
  id: string;
  name: string;
  region: string;
  gstin: string;
  contact: string;
  email: string;
  phone: string;
  creditLimit: number;
  enabled: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Persisted invoice/proforma. Monetary amounts are stored in the entered currency. */
export interface Invoice {
  id: string;
  clientId: string;
  number: string;
  /** Original proforma reference, retained after a proforma is converted to an invoice. */
  proformaNumber?: string;
  isProforma: boolean;
  invoiceDate: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd
  amount: number;
  notes: string;
  filePath?: string;
  fileName?: string;
  // Write-off
  writtenOff: boolean;
  writeOffAmount?: number;
  writeOffReason?: string;
  writeOffDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAllocation {
  invoiceId: string;
  amount: number;
}

export type PaymentMode =
  | "Cash"
  | "UPI"
  | "NEFT"
  | "RTGS"
  | "IMPS"
  | "Cheque"
  | "Card"
  | "Other";

export interface Payment {
  id: string;
  clientId: string;
  paymentDate: string; // yyyy-mm-dd
  amount: number;
  mode: PaymentMode;
  reference: string;
  bank: string;
  notes: string;
  filePath?: string;
  fileName?: string;
  allocations: PaymentAllocation[];
  createdAt: string;
}

export type UserRole = "manager" | "viewer";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

// ---- Derived (computed) shapes, never persisted ----

export type InvoiceStatus =
  | "pending"
  | "partial"
  | "paid"
  | "overdue"
  | "written-off";

export interface InvoiceView extends Invoice {
  paid: number;
  balance: number;
  status: InvoiceStatus;
  agingDays: number;
}

export interface ClientSummary {
  outstanding: number; // sum of unpaid balances (proforma + invoice)
  overdue: number; // balances past due date (invoices only)
  advance: number; // unallocated payments held on account
  collected: number; // total money allocated to this client's invoices
  writtenOff: number;
  invoiceCount: number;
  proformaCount: number;
  oldestPendingDays: number;
  lastPaymentDate: string | null;
}

export interface ClientWithSummary extends Client {
  summary: ClientSummary;
}

export interface LedgerEntry {
  date: string;
  type: "Invoice" | "Proforma" | "Payment" | "Write-off";
  description: string;
  debit: number;
  credit: number;
  balance: number;
  ref?: string;
}

export interface DashboardTotals {
  totalOutstanding: number;
  totalReceivable: number; // gross invoiced (all non-written-off invoice amounts)
  collected: number; // all-time collected
  collectedThisMonth: number;
  pendingCollection: number;
  overdue: number;
  writtenOff: number;
  advance: number;
  collectionRate: number; // collected / (collected + outstanding)
  clientsWithOutstanding: number;
  overdueInvoices: number;
  activeClients: number;
}

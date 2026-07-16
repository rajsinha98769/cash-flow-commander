// Mock data for the AR & Collections module.
// UI-only — no persistence.

export type Risk = "low" | "medium" | "high" | "critical";
export type InvoiceStatus =
  | "pending"
  | "partial"
  | "paid"
  | "overdue"
  | "disputed"
  | "written-off";

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paid: number;
  status: InvoiceStatus;
  assignedTo: string;
  priority: "low" | "medium" | "high";
  agingDays: number;
}

export interface Client {
  id: string;
  name: string;
  region: string;
  gstin: string;
  contact: string;
  email: string;
  phone: string;
  creditLimit: number;
  outstanding: number;
  overdue: number;
  advance: number;
  invoiceCount: number;
  oldestInvoice: string;
  oldestInvoiceDays: number;
  status: "active" | "watch" | "hold" | "legal";
  collector: string;
  lastPayment: string;
  nextFollowup: string;
  collectionScore: number; // 0-100
  risk: Risk;
}

export const collectors = [
  "Sarah Jenkins",
  "Mike Ross",
  "Priya Menon",
  "Daniel Kim",
  "Ava Thompson",
];

export const clients: Client[] = [
  {
    id: "c-001",
    name: "Horizon Logistics Ltd",
    region: "West",
    gstin: "27AAACH0123L1Z2",
    contact: "Ramesh Iyer",
    email: "accounts@horizonlog.com",
    phone: "+91 98200 12345",
    creditLimit: 100_000,
    outstanding: 45_200,
    overdue: 45_200,
    advance: 0,
    invoiceCount: 4,
    oldestInvoice: "INV-9021",
    oldestInvoiceDays: 64,
    status: "watch",
    collector: "Sarah Jenkins",
    lastPayment: "2026-05-14",
    nextFollowup: "2026-07-17 14:00",
    collectionScore: 58,
    risk: "high",
  },
  {
    id: "c-002",
    name: "Veritas Medical Systems",
    region: "South",
    gstin: "29AAECV5567K1ZA",
    contact: "Anita George",
    email: "ap@veritasmed.io",
    phone: "+91 98450 55221",
    creditLimit: 250_000,
    outstanding: 12_850.4,
    overdue: 12_850.4,
    advance: 0,
    invoiceCount: 2,
    oldestInvoice: "INV-9155",
    oldestInvoiceDays: 12,
    status: "active",
    collector: "Mike Ross",
    lastPayment: "2026-06-28",
    nextFollowup: "2026-07-18 11:30",
    collectionScore: 82,
    risk: "medium",
  },
  {
    id: "c-003",
    name: "CloudScale Engineering",
    region: "North",
    gstin: "07AAJCS4432M2Z6",
    contact: "Vikram Sethi",
    email: "finance@cloudscale.dev",
    phone: "+91 98110 33902",
    creditLimit: 150_000,
    outstanding: 8_200,
    overdue: 0,
    advance: 2_500,
    invoiceCount: 1,
    oldestInvoice: "INV-9188",
    oldestInvoiceDays: 3,
    status: "active",
    collector: "Unassigned",
    lastPayment: "2026-07-08",
    nextFollowup: "—",
    collectionScore: 94,
    risk: "low",
  },
  {
    id: "c-004",
    name: "Apex Holdings Pvt Ltd",
    region: "West",
    gstin: "27AAACA1122J1Z9",
    contact: "Deepa Shah",
    email: "deepa@apexholdings.in",
    phone: "+91 98220 44711",
    creditLimit: 500_000,
    outstanding: 82_400,
    overdue: 62_400,
    advance: 0,
    invoiceCount: 6,
    oldestInvoice: "INV-8834",
    oldestInvoiceDays: 118,
    status: "hold",
    collector: "Sarah Jenkins",
    lastPayment: "2026-03-22",
    nextFollowup: "2026-07-17 14:00",
    collectionScore: 41,
    risk: "critical",
  },
  {
    id: "c-005",
    name: "Global Retail Inc",
    region: "East",
    gstin: "19AABCG9987P1Z1",
    contact: "Rohit Banerjee",
    email: "ap@globalretail.co",
    phone: "+91 98300 77120",
    creditLimit: 300_000,
    outstanding: 34_600,
    overdue: 14_600,
    advance: 0,
    invoiceCount: 3,
    oldestInvoice: "INV-9010",
    oldestInvoiceDays: 42,
    status: "watch",
    collector: "Priya Menon",
    lastPayment: "2026-06-04",
    nextFollowup: "2026-07-17 16:30",
    collectionScore: 66,
    risk: "high",
  },
  {
    id: "c-006",
    name: "Nordic Textile Mills",
    region: "West",
    gstin: "27AAECN1198R1Z4",
    contact: "Meera Kapoor",
    email: "accounts@nordictex.com",
    phone: "+91 98198 20014",
    creditLimit: 200_000,
    outstanding: 22_100,
    overdue: 0,
    advance: 0,
    invoiceCount: 2,
    oldestInvoice: "INV-9166",
    oldestInvoiceDays: 9,
    status: "active",
    collector: "Daniel Kim",
    lastPayment: "2026-07-01",
    nextFollowup: "2026-07-22 10:00",
    collectionScore: 88,
    risk: "low",
  },
  {
    id: "c-007",
    name: "Meridian Consulting Group",
    region: "South",
    gstin: "33AAECM6621F1Z8",
    contact: "Karan Rao",
    email: "karan@meridiancg.io",
    phone: "+91 98410 33712",
    creditLimit: 120_000,
    outstanding: 18_900,
    overdue: 18_900,
    advance: 0,
    invoiceCount: 3,
    oldestInvoice: "INV-8981",
    oldestInvoiceDays: 78,
    status: "watch",
    collector: "Ava Thompson",
    lastPayment: "2026-04-30",
    nextFollowup: "2026-07-19 13:00",
    collectionScore: 52,
    risk: "high",
  },
  {
    id: "c-008",
    name: "Bluewater Marine Ltd",
    region: "West",
    gstin: "27AABCB4498T1Z0",
    contact: "Sanjay Nair",
    email: "s.nair@bluewater.in",
    phone: "+91 98240 60021",
    creditLimit: 400_000,
    outstanding: 96_500,
    overdue: 74_300,
    advance: 0,
    invoiceCount: 5,
    oldestInvoice: "INV-8720",
    oldestInvoiceDays: 156,
    status: "legal",
    collector: "Sarah Jenkins",
    lastPayment: "2026-02-11",
    nextFollowup: "2026-07-18 09:30",
    collectionScore: 28,
    risk: "critical",
  },
];

export const invoices: Invoice[] = [
  { id: "i-1", number: "INV-9021", clientId: "c-001", clientName: "Horizon Logistics Ltd", invoiceDate: "2026-05-13", dueDate: "2026-05-28", amount: 25_400, paid: 0, status: "overdue", assignedTo: "Sarah Jenkins", priority: "high", agingDays: 64 },
  { id: "i-2", number: "INV-9042", clientId: "c-001", clientName: "Horizon Logistics Ltd", invoiceDate: "2026-05-22", dueDate: "2026-06-06", amount: 19_800, paid: 0, status: "overdue", assignedTo: "Sarah Jenkins", priority: "high", agingDays: 55 },
  { id: "i-3", number: "INV-9155", clientId: "c-002", clientName: "Veritas Medical Systems", invoiceDate: "2026-06-20", dueDate: "2026-07-05", amount: 12_850.4, paid: 0, status: "overdue", assignedTo: "Mike Ross", priority: "medium", agingDays: 12 },
  { id: "i-4", number: "INV-9188", clientId: "c-003", clientName: "CloudScale Engineering", invoiceDate: "2026-07-10", dueDate: "2026-07-25", amount: 8_200, paid: 0, status: "pending", assignedTo: "Unassigned", priority: "low", agingDays: 3 },
  { id: "i-5", number: "INV-8834", clientId: "c-004", clientName: "Apex Holdings Pvt Ltd", invoiceDate: "2026-03-20", dueDate: "2026-04-04", amount: 30_000, paid: 10_000, status: "partial", assignedTo: "Sarah Jenkins", priority: "high", agingDays: 118 },
  { id: "i-6", number: "INV-8901", clientId: "c-004", clientName: "Apex Holdings Pvt Ltd", invoiceDate: "2026-04-15", dueDate: "2026-04-30", amount: 22_400, paid: 0, status: "overdue", assignedTo: "Sarah Jenkins", priority: "high", agingDays: 92 },
  { id: "i-7", number: "INV-9010", clientId: "c-005", clientName: "Global Retail Inc", invoiceDate: "2026-05-30", dueDate: "2026-06-14", amount: 14_600, paid: 0, status: "disputed", assignedTo: "Priya Menon", priority: "high", agingDays: 42 },
  { id: "i-8", number: "INV-9101", clientId: "c-005", clientName: "Global Retail Inc", invoiceDate: "2026-06-18", dueDate: "2026-07-03", amount: 20_000, paid: 0, status: "pending", assignedTo: "Priya Menon", priority: "medium", agingDays: 14 },
  { id: "i-9", number: "INV-9166", clientId: "c-006", clientName: "Nordic Textile Mills", invoiceDate: "2026-07-04", dueDate: "2026-07-19", amount: 15_600, paid: 0, status: "pending", assignedTo: "Daniel Kim", priority: "low", agingDays: 9 },
  { id: "i-10", number: "INV-8981", clientId: "c-007", clientName: "Meridian Consulting Group", invoiceDate: "2026-04-25", dueDate: "2026-05-10", amount: 8_900, paid: 0, status: "overdue", assignedTo: "Ava Thompson", priority: "medium", agingDays: 78 },
  { id: "i-11", number: "INV-8720", clientId: "c-008", clientName: "Bluewater Marine Ltd", invoiceDate: "2026-02-08", dueDate: "2026-02-23", amount: 42_000, paid: 0, status: "overdue", assignedTo: "Sarah Jenkins", priority: "high", agingDays: 156 },
  { id: "i-12", number: "INV-8815", clientId: "c-008", clientName: "Bluewater Marine Ltd", invoiceDate: "2026-03-11", dueDate: "2026-03-26", amount: 32_300, paid: 0, status: "overdue", assignedTo: "Sarah Jenkins", priority: "high", agingDays: 125 },
];

export const dashboardKpis = {
  totalOutstanding: 1_428_940,
  totalReceivable: 2_140_800,
  collectedMTD: 642_100,
  pendingCollection: 786_840,
  overdue: 284_500,
  writtenOff: 42_300,
  collectionRate: 78.4,
  avgCollectionDays: 42,
  clientsOutstanding: 142,
  overdueInvoices: 32,
};

export const outstandingTrend = [
  { month: "Feb", outstanding: 1_180_000, collected: 420_000 },
  { month: "Mar", outstanding: 1_240_000, collected: 510_000 },
  { month: "Apr", outstanding: 1_310_000, collected: 470_000 },
  { month: "May", outstanding: 1_390_000, collected: 580_000 },
  { month: "Jun", outstanding: 1_410_000, collected: 620_000 },
  { month: "Jul", outstanding: 1_428_940, collected: 642_100 },
];

export const agingBuckets = [
  { bucket: "Current", days: "0", amount: 620_000, count: 48, clients: 62, recovery: 98 },
  { bucket: "1-30 Days", days: "1-30", amount: 230_000, count: 22, clients: 31, recovery: 84 },
  { bucket: "31-60 Days", days: "31-60", amount: 168_000, count: 18, clients: 22, recovery: 71 },
  { bucket: "61-90 Days", days: "61-90", amount: 124_500, count: 14, clients: 15, recovery: 55 },
  { bucket: "91-180 Days", days: "91-180", amount: 168_440, count: 11, clients: 9, recovery: 32 },
  { bucket: "180-365 Days", days: "180-365", amount: 82_000, count: 5, clients: 4, recovery: 18 },
  { bucket: "365+ Days", days: "365+", amount: 36_000, count: 3, clients: 2, recovery: 6 },
];

export const collectorPerformance = [
  { name: "Sarah Jenkins", collected: 184_200, target: 220_000, active: 34 },
  { name: "Mike Ross", collected: 142_800, target: 180_000, active: 28 },
  { name: "Priya Menon", collected: 118_500, target: 160_000, active: 24 },
  { name: "Daniel Kim", collected: 96_600, target: 140_000, active: 19 },
  { name: "Ava Thompson", collected: 100_000, target: 130_000, active: 17 },
];

export const followups = [
  { id: "f-1", client: "Apex Holdings", collector: "Sarah Jenkins", note: "PTP: $5,000 via WhatsApp", when: "Today, 14:00", channel: "whatsapp", risk: "critical" as Risk, outstanding: 82_400 },
  { id: "f-2", client: "Global Retail Inc", collector: "Priya Menon", note: "Confirm dispute resolution", when: "Overdue 2h", channel: "email", risk: "high" as Risk, outstanding: 34_600 },
  { id: "f-3", client: "Bluewater Marine Ltd", collector: "Sarah Jenkins", note: "Escalation to legal — final notice", when: "Tomorrow, 09:30", channel: "email", risk: "critical" as Risk, outstanding: 96_500 },
  { id: "f-4", client: "Meridian Consulting", collector: "Ava Thompson", note: "Reconciliation call", when: "Fri, 13:00", channel: "call", risk: "high" as Risk, outstanding: 18_900 },
  { id: "f-5", client: "Nordic Textile Mills", collector: "Daniel Kim", note: "Send monthly statement", when: "Mon, 10:00", channel: "email", risk: "low" as Risk, outstanding: 22_100 },
];

export const recentPayments = [
  { id: "p-1", client: "Crystal Corp", amount: 42_000, mode: "RTGS", ref: "#847291", when: "2h ago", collector: "Mike Ross" },
  { id: "p-2", client: "Zion Enterprises", amount: 210_000, mode: "IMPS", ref: "#129304", when: "4h ago", collector: "Sarah Jenkins" },
  { id: "p-3", client: "Meridian Consulting", amount: 8_900, mode: "NEFT", ref: "#772201", when: "Yesterday", collector: "Ava Thompson" },
  { id: "p-4", client: "CloudScale Engineering", amount: 15_000, mode: "UPI", ref: "#UPI-5501", when: "Yesterday", collector: "Daniel Kim" },
  { id: "p-5", client: "Nordic Textile Mills", amount: 22_400, mode: "Cheque", ref: "CHQ-00812", when: "2 days ago", collector: "Daniel Kim" },
];

export const activityFeed = [
  { id: "a-1", type: "payment", client: "Crystal Corp", text: "Payment $42,000 received via RTGS", at: "10:14 AM", collector: "Mike Ross" },
  { id: "a-2", type: "ptp", client: "Apex Holdings", text: "New Promise to Pay: $5,000 by Jul 17", at: "09:45 AM", collector: "Sarah Jenkins" },
  { id: "a-3", type: "call", client: "Bluewater Marine", text: "Outbound call — client requested 15-day extension", at: "Yesterday", collector: "Sarah Jenkins" },
  { id: "a-4", type: "dispute", client: "Global Retail Inc", text: "Dispute raised on INV-9010 — quantity mismatch", at: "Yesterday", collector: "Priya Menon" },
  { id: "a-5", type: "escalation", client: "Bluewater Marine", text: "Escalated to legal team", at: "2 days ago", collector: "Sarah Jenkins" },
  { id: "a-6", type: "email", client: "Meridian Consulting", text: "Reminder email sent with statement of account", at: "2 days ago", collector: "Ava Thompson" },
  { id: "a-7", type: "broken-ptp", client: "Horizon Logistics", text: "Promise to Pay broken — $10,000 not received", at: "3 days ago", collector: "Sarah Jenkins" },
];

export const kanbanColumns = [
  { id: "new", title: "New", accent: "bg-slate-400" },
  { id: "today", title: "Contact Today", accent: "bg-brand" },
  { id: "waiting", title: "Waiting Response", accent: "bg-slate-500" },
  { id: "ptp", title: "Promise to Pay", accent: "bg-warning" },
  { id: "expected", title: "Payment Expected", accent: "bg-success" },
  { id: "escalated", title: "Escalated", accent: "bg-danger" },
  { id: "legal", title: "Legal", accent: "bg-danger" },
  { id: "closed", title: "Closed", accent: "bg-muted-foreground" },
];

export const kanbanCards: Record<string, Array<{
  id: string; client: string; outstanding: number; collector: string; nextFollowup: string; lastContact: string; risk: Risk;
}>> = {
  new: [
    { id: "k-1", client: "CloudScale Engineering", outstanding: 8_200, collector: "Unassigned", nextFollowup: "—", lastContact: "None", risk: "low" },
    { id: "k-2", client: "Northwind Traders", outstanding: 4_500, collector: "Unassigned", nextFollowup: "—", lastContact: "None", risk: "low" },
  ],
  today: [
    { id: "k-3", client: "Apex Holdings", outstanding: 82_400, collector: "Sarah Jenkins", nextFollowup: "14:00", lastContact: "2d ago", risk: "critical" },
    { id: "k-4", client: "Global Retail Inc", outstanding: 34_600, collector: "Priya Menon", nextFollowup: "16:30", lastContact: "Yesterday", risk: "high" },
  ],
  waiting: [
    { id: "k-5", client: "Horizon Logistics", outstanding: 45_200, collector: "Sarah Jenkins", nextFollowup: "Fri", lastContact: "Mon", risk: "high" },
  ],
  ptp: [
    { id: "k-6", client: "Meridian Consulting", outstanding: 18_900, collector: "Ava Thompson", nextFollowup: "Jul 19", lastContact: "Tue", risk: "high" },
  ],
  expected: [
    { id: "k-7", client: "Veritas Medical", outstanding: 12_850, collector: "Mike Ross", nextFollowup: "Jul 18", lastContact: "Today", risk: "medium" },
  ],
  escalated: [
    { id: "k-8", client: "Bluewater Marine", outstanding: 96_500, collector: "Sarah Jenkins", nextFollowup: "Tomorrow", lastContact: "3d ago", risk: "critical" },
  ],
  legal: [
    { id: "k-9", client: "Zenith Metals Ltd", outstanding: 118_000, collector: "Legal Team", nextFollowup: "Jul 30", lastContact: "10d ago", risk: "critical" },
  ],
  closed: [
    { id: "k-10", client: "Crystal Corp", outstanding: 0, collector: "Mike Ross", nextFollowup: "—", lastContact: "Today", risk: "low" },
  ],
};

export const disputes = [
  { id: "d-1", invoice: "INV-9010", client: "Global Retail Inc", reason: "Quantity mismatch — 4 units shy", owner: "Priya Menon", status: "Under Review", outstanding: 14_600, expected: "2026-07-25", raisedOn: "2026-07-05" },
  { id: "d-2", invoice: "INV-8720", client: "Bluewater Marine Ltd", reason: "Service SLA breach claim", owner: "Sarah Jenkins", status: "Legal Review", outstanding: 42_000, expected: "2026-08-10", raisedOn: "2026-05-28" },
  { id: "d-3", invoice: "INV-8981", client: "Meridian Consulting", reason: "Duplicate billing dispute", owner: "Ava Thompson", status: "Pending Docs", outstanding: 8_900, expected: "2026-07-22", raisedOn: "2026-06-18" },
];

export const writeOffs = [
  { id: "w-1", invoice: "INV-7712", client: "Silverline Traders", outstanding: 18_400, reason: "Insolvency — court order", status: "Approved", approver: "CFO", recoveryProb: 5, submittedOn: "2026-06-14" },
  { id: "w-2", invoice: "INV-7801", client: "Dawn Ventures", outstanding: 9_200, reason: "Company dissolved", status: "Pending Approval", approver: "—", recoveryProb: 10, submittedOn: "2026-07-08" },
  { id: "w-3", invoice: "INV-7920", client: "Kwik Retail", outstanding: 6_400, reason: "Uncontactable > 365 days", status: "Pending Approval", approver: "—", recoveryProb: 15, submittedOn: "2026-07-10" },
];

export const ledgerEntries = [
  { date: "2026-04-01", type: "Opening", description: "Opening Balance", debit: 0, credit: 0, balance: 24_800 },
  { date: "2026-04-15", type: "Invoice", description: "INV-8901", debit: 22_400, credit: 0, balance: 47_200 },
  { date: "2026-05-13", type: "Invoice", description: "INV-9021", debit: 25_400, credit: 0, balance: 72_600 },
  { date: "2026-05-22", type: "Invoice", description: "INV-9042", debit: 19_800, credit: 0, balance: 92_400 },
  { date: "2026-05-30", type: "Payment", description: "IMPS #445120", debit: 0, credit: 20_000, balance: 72_400 },
  { date: "2026-06-08", type: "Credit Note", description: "CN-0142 — service reversal", debit: 0, credit: 4_800, balance: 67_600 },
  { date: "2026-06-14", type: "Adjustment", description: "Rounding write-back", debit: 0, credit: 200, balance: 67_400 },
  { date: "2026-07-14", type: "Closing", description: "Current Balance", debit: 0, credit: 0, balance: 67_400 },
];

export const paymentHistory = [
  { date: "2026-05-30", amount: 20_000, mode: "IMPS", ref: "#445120", against: "INV-8901 (partial)", collector: "Sarah Jenkins", remarks: "Part payment received" },
  { date: "2026-04-22", amount: 12_500, mode: "RTGS", ref: "#331209", against: "INV-8814", collector: "Sarah Jenkins", remarks: "—" },
  { date: "2026-03-18", amount: 34_800, mode: "Cheque", ref: "CHQ-00554", against: "INV-8720", collector: "Sarah Jenkins", remarks: "Cleared on Mar 22" },
];

export function fmt(n: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function fmtCompact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n}`;
}

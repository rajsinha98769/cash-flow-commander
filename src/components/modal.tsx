import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

/** Lightweight controlled modal used by the CRUD/settlement forms. */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${width} bg-card border border-primary/10 rounded-xl shadow-xl max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start justify-between p-5 border-b border-primary/5">
          <div>
            <h2 className="font-bold text-lg">{title}</h2>
            {subtitle ? <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-primary/5"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label-kicker text-[10px] block mb-1">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-muted-foreground mt-1 block">{hint}</span> : null}
    </label>
  );
}

export const inputCls =
  "w-full h-10 px-3 rounded-lg border border-primary/10 bg-card text-sm outline-none focus:border-brand";
export const textareaCls =
  "w-full px-3 py-2 rounded-lg border border-primary/10 bg-card text-sm outline-none focus:border-brand min-h-[72px]";

"use client";

import { ReactNode } from "react";
import { STATUS_LABEL } from "@/lib/rules";
import { Loader2 } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABEL[status] ?? status;
  return (
    <span className={`st-roomie-status st-status-${status}`} title={label}>
      <span className="dot" />
      {label}
    </span>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

export function Loading({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
      <Spinner className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-12 px-4">
      {icon && <div className="text-muted-foreground/60">{icon}</div>}
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function FieldError({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return <p className="text-sm text-destructive mt-1">{msg}</p>;
}

export function InfoNote({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "danger" | "success";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    info: "bg-accent/60 text-accent-foreground border-accent",
    warn: "bg-amber-50 text-amber-900 border-amber-200",
    danger: "bg-red-50 text-red-900 border-red-200",
    success: "bg-emerald-50 text-emerald-900 border-emerald-200",
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

/** Format tanggal "Senin, 3 Mar 2026" dari YYYY-MM-DD. */
export function formatTanggalPanjang(tanggal: string): string {
  try {
    const d = new Date(tanggal + "T12:00:00+07:00");
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return tanggal;
  }
}

export function formatTanggalPendek(tanggal: string): string {
  try {
    const d = new Date(tanggal + "T12:00:00+07:00");
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return tanggal;
  }
}

export function formatWaktu(iso: string | Date | null): string {
  if (!iso) return "-";
  if (iso instanceof Date) {
    if (isNaN(iso.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(iso);
  }
  const d = new Date(iso);
  // bila bukan ISO valid (mis. sudah terformat), kembalikan apa adanya
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function relativeTime(iso: string | Date | null): string {
  if (!iso) return "-";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return typeof iso === "string" ? iso : "-";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} menit lalu`;
  const jam = Math.floor(min / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  return formatTanggalPendek(typeof iso === "string" ? iso.slice(0, 10) : "");
}

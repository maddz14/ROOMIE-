"use client";

import { useEffect, useState } from "react";
import { navigate } from "../router";
import { useAuth } from "../auth";
import { api } from "../api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loading, EmptyState, PageHeader, relativeTime } from "../ui-bits";
import { Bell, CheckCheck } from "lucide-react";

type Notif = {
  id: number;
  judul: string;
  pesan: string;
  isRead: boolean;
  bookingId: number | null;
  createdAt: string;
};

export function Notifikasi() {
  const { setUnread } = useAuth();
  const [list, setList] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const d = await api<{ notifikasi: Notif[]; unread: number }>(
        "/api/notifikasi",
      );
      setList(d.notifikasi);
      setUnread(d.unread);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function buka(n: Notif) {
    if (!n.isRead) {
      try {
        await api(`/api/notifikasi/${n.id}/baca`, { method: "POST" });
      } catch {}
    }
    setList((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
    );
    if (n.bookingId) navigate(`/pengajuan/${n.bookingId}`);
  }

  async function bacaSemua() {
    try {
      await api("/api/notifikasi/baca-semua", { method: "POST" });
      setList((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
      toast.success("Semua notifikasi ditandai terbaca.");
    } catch (e: any) {
      toast.error(e.message || "Gagal.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Notifikasi"
        description="Pemberitahuan terbaru tentang pengajuan Anda."
        action={
          <Button variant="outline" onClick={bacaSemua} disabled={list.every((n) => n.isRead)}>
            <CheckCheck className="h-4 w-4 mr-1.5" /> Tandai semua terbaca
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="Tidak ada notifikasi"
          description="Pemberitahuan tentang pengajuan Anda akan muncul di sini."
        />
      ) : (
        <ul className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {list.map((n) => (
            <li
              key={n.id}
              onClick={() => buka(n)}
              className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                !n.isRead ? "bg-accent/30" : ""
              }`}
            >
              <div className="relative shrink-0">
                <div className="grid place-items-center h-9 w-9 rounded-full bg-accent text-accent-foreground">
                  <Bell className="h-4 w-4" />
                </div>
                {!n.isRead && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm ${
                    !n.isRead ? "font-bold" : "font-medium"
                  }`}
                >
                  {n.judul}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {n.pesan}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {relativeTime(n.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

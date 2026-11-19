"use client";

import { useEffect, useMemo, useState } from "react";
import { navigate, useRoute } from "../router";
import { api } from "../api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loading, EmptyState, PageHeader, StatusBadge, formatTanggalPendek } from "../ui-bits";
import { Search, ClipboardList, Plus, Building2 } from "lucide-react";

type Booking = any;

const TABS = [
  { value: "semua", label: "Semua" },
  { value: "berjalan", label: "Berjalan" },
  { value: "disetujui", label: "Disetujui" },
  { value: "selesai", label: "Selesai" },
  { value: "ditolak_dibatalkan", label: "Ditolak / Dibatalkan" },
];

export function PengajuanSaya() {
  const route = useRoute();
  const [tab, setTab] = useState(route.query.get("status") || "semua");
  const [q, setQ] = useState("");
  const [all, setAll] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await api<{ bookings: Booking[] }>("/api/booking?status=semua");
        setAll(d.bookings);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return all.filter((b) => {
      if (qq) {
        const inJudul = b.judulKegiatan?.toLowerCase().includes(qq);
        const inKode = b.kodeBooking?.toLowerCase().includes(qq);
        if (!inJudul && !inKode) return false;
      }
      if (tab === "semua") return true;
      if (tab === "berjalan")
        return ["menunggu_kemahasiswaan", "menunggu_ga", "disetujui", "berlangsung"].includes(
          b.status,
        );
      if (tab === "ditolak_dibatalkan")
        return ["ditolak", "dibatalkan"].includes(b.status);
      return b.status === tab;
    });
  }, [all, q, tab]);

  return (
    <div>
      <PageHeader
        title="Pengajuan Saya"
        description="Lacak semua peminjaman yang Anda ajukan."
        action={
          <Button onClick={() => navigate("/ruang")}>
            <Plus className="h-4 w-4 mr-1.5" /> Ajukan
          </Button>
        }
      />

      <div className="space-y-3 mb-4">
        <div className="flex gap-2 overflow-x-auto roomie-scroll pb-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-3 h-9 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
                tab === t.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground/80 border-border hover:border-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kode atau judul..."
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="Belum ada pengajuan"
          description="Ajukan peminjaman ruang untuk melihatnya di sini."
          action={
            <Button onClick={() => navigate("/ruang")}>Pilih Ruang</Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((b) => (
            <li
              key={b.id}
              onClick={() => navigate(`/pengajuan/${b.id}`)}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">
                    {b.kodeBooking}
                  </p>
                  <p className="font-semibold truncate mt-0.5">{b.judulKegiatan}</p>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                    <Building2 className="h-3.5 w-3.5" />
                    {b.resource?.nama}
                    <span className="opacity-40">·</span>
                    {formatTanggalPendek(b.tanggal)} {b.jamMulai}–{b.jamSelesai}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

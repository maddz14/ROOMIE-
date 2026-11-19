"use client";

import { useEffect, useMemo, useState } from "react";
import { navigate } from "../router";
import { api } from "../api";
import { useMeta } from "../meta";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading, PageHeader } from "../ui-bits";
import { Search, Building2, Users, MapPin, CalendarDays, Plus } from "lucide-react";

type Ruang = {
  id: number;
  kode: string;
  nama: string;
  tipe: string;
  tipeLabel: string;
  gedung: string | null;
  lantai: string | null;
  kapasitas: number;
  deskripsi: string | null;
  fasilitas: { facilityId: number; nama: string; satuan: string; jumlah: number }[];
};

export function Ruang() {
  const { meta } = useMeta();
  const [all, setAll] = useState<Ruang[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipe, setTipe] = useState("semua");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await api<{ ruang: Ruang[] }>("/api/ruang");
        setAll(d.ruang);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return all.filter((r) => {
      if (tipe !== "semua" && r.tipe !== tipe) return false;
      if (!qq) return true;
      return (
        r.nama.toLowerCase().includes(qq) ||
        r.kode.toLowerCase().includes(qq) ||
        (r.gedung || "").toLowerCase().includes(qq)
      );
    });
  }, [all, tipe, q]);

  const chips = [{ value: "semua", label: "Semua" }, ...meta.tipeRuang];

  return (
    <div>
      <PageHeader
        title="Ruang & Lapangan"
        description="Pilih ruang yang ingin Anda pinjam. Lihat jadwal atau langsung ajukan."
      />

      <div className="space-y-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, kode, atau gedung..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto roomie-scroll pb-1">
          {chips.map((c) => (
            <button
              key={c.value}
              onClick={() => setTipe(c.value)}
              className={`px-3 h-9 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
                tipe === c.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground/80 border-border hover:border-primary"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="Tidak ada ruang yang cocok"
          description="Coba ubah pencarian atau filter jenis ruang."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-card border border-border rounded-xl p-4 flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {r.nama}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kode {r.kode} · {r.tipeLabel}
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground">
                  <Users className="h-3 w-3" /> Maks. {r.kapasitas || "–"}
                </span>
              </div>
              {(r.gedung || r.lantai) && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {r.gedung}
                  {r.lantai ? ` · Lt. ${r.lantai}` : ""}
                </p>
              )}
              {r.deskripsi && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {r.deskripsi}
                </p>
              )}
              {r.fasilitas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {r.fasilitas.slice(0, 5).map((f) => (
                    <span
                      key={f.facilityId}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                    >
                      {f.nama} {f.jumlah > 1 ? `×${f.jumlah}` : ""}
                    </span>
                  ))}
                  {r.fasilitas.length > 5 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      +{r.fasilitas.length - 5}
                    </span>
                  )}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-border flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    navigate(`/kalender?ruang=${r.id}`)
                  }
                >
                  <CalendarDays className="h-4 w-4 mr-1.5" /> Jadwal
                </Button>
                <Button
                  className="flex-1"
                  onClick={() =>
                    navigate(`/ajukan?ruang=${r.id}`)
                  }
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Pinjam
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

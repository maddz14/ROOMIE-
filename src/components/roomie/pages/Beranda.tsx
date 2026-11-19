"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { navigate } from "../router";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, Loading, EmptyState, PageHeader } from "../ui-bits";
import { formatTanggalPendek } from "../ui-bits";
import {
  CalendarPlus,
  Hourglass,
  CheckCircle2,
  History,
  ShieldCheck,
  Clock,
  Moon,
  ArrowRight,
  Building2,
  ClipboardList,
} from "lucide-react";

type Booking = any;

export function Beranda() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<Booking[]>([]);
  const [persetujuan, setPersetujuan] = useState<Booking[]>([]);
  const [ringkasan, setRingkasan] = useState<any>(null);
  const [perRuang, setPerRuang] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (user?.roleNama === "peminjam") {
          const d = await api<{ bookings: Booking[] }>("/api/booking?status=semua");
          setMine(d.bookings);
        } else if (
          user?.roleNama === "kemahasiswaan" ||
          user?.roleNama === "ga"
        ) {
          const [p, r] = await Promise.all([
            api<{ bookings: Booking[] }>("/api/persetujuan?tab=menunggu"),
            api<any>("/api/laporan/ringkasan"),
          ]);
          setPersetujuan(p.bookings);
          setRingkasan(r.ringkasan);
          setPerRuang(r.perRuang.slice(0, 5));
        } else if (user?.roleNama === "admin") {
          const r = await api<any>("/api/laporan/ringkasan");
          setRingkasan(r.ringkasan);
          setPerRuang(r.perRuang.slice(0, 5));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.roleNama]);

  if (!user) return null;
  if (loading) return <Loading />;

  const now = new Date();
  const bulanIni = now.toISOString().slice(0, 7);

  if (user.roleNama === "peminjam") {
    const menunggu = mine.filter((b) =>
      ["menunggu_kemahasiswaan", "menunggu_ga"].includes(b.status),
    ).length;
    const disetujuiAkanDatang = mine.filter(
      (b) => b.status === "disetujui" && b.tanggal >= new Date().toISOString().slice(0, 10),
    ).length;
    const selesaiBulanIni = mine.filter(
      (b) => b.status === "selesai" && b.tanggal.slice(0, 7) === bulanIni,
    ).length;
    const akanDatang = mine
      .filter((b) =>
        ["menunggu_kemahasiswaan", "menunggu_ga", "disetujui", "berlangsung"].includes(
          b.status,
        ),
      )
      .sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))
      .slice(0, 5);

    return (
      <div>
        <PageHeader
          title={`Halo, ${user.nama.split(" ")[0]}`}
          description="Kelola peminjaman ruang dan lacak statusnya di satu tempat."
          action={
            <Button onClick={() => navigate("/ruang")} className="h-11">
              <CalendarPlus className="h-4 w-4 mr-2" /> Ajukan Peminjaman
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <StatCard
            icon={<Hourglass className="h-5 w-5" />}
            label="Menunggu keputusan"
            value={menunggu}
            to="/pengajuan?status=berjalan"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Disetujui akan datang"
            value={disetujuiAkanDatang}
            to="/pengajuan?status=disetujui"
          />
          <StatCard
            icon={<History className="h-5 w-5" />}
            label="Selesai bulan ini"
            value={selesaiBulanIni}
            to="/pengajuan?status=selesai"
          />
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Acara Anda berikutnya</CardTitle>
            <button
              onClick={() => navigate("/pengajuan")}
              className="text-sm text-primary hover:underline"
            >
              Lihat semua
            </button>
          </CardHeader>
          <CardContent>
            {akanDatang.length === 0 ? (
              <EmptyState
                icon={<CalendarPlus className="h-8 w-8" />}
                title="Anda belum punya pengajuan aktif"
                description="Mulai dengan memilih ruang yang ingin dipinjam."
                action={
                  <Button onClick={() => navigate("/ruang")}>
                    Pilih Ruang
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {akanDatang.map((b) => (
                  <li
                    key={b.id}
                    onClick={() => navigate(`/pengajuan/${b.id}`)}
                    className="py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-lg"
                  >
                    <div className="grid place-items-center h-11 w-11 rounded-lg bg-accent text-accent-foreground shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{b.judulKegiatan}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {b.resource?.nama} · {formatTanggalPendek(b.tanggal)} ·{" "}
                        {b.jamMulai}–{b.jamSelesai}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // kemahasiswaan / ga / admin
  return (
    <div>
      <PageHeader
        title={`Halo, ${user.nama.split(" ")[0]}`}
        description={
          user.roleNama === "admin"
            ? "Ringkasan aktivitas peminjaman ruang kampus."
            : "Antrean persetujuan pengajuan peminjaman."
        }
      />

      {user.roleNama === "admin" ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              icon={<ClipboardList className="h-5 w-5" />}
              label="Total pengajuan (semutlakhir)"
              value={ringkasan?.total ?? 0}
            />
            <StatCard
              icon={<ShieldCheck className="h-5 w-5" />}
              label="Menunggu keputusan"
              value={ringkasan?.menunggu ?? 0}
              to="/admin"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Disetujui"
              value={ringkasan?.disetujui ?? 0}
              to="/laporan"
            />
            <StatCard
              icon={<History className="h-5 w-5" />}
              label="Selesai"
              value={ringkasan?.selesai ?? 0}
              to="/laporan"
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ruang paling sering dipakai</CardTitle>
            </CardHeader>
            <CardContent>
              {perRuang.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data.</p>
              ) : (
                <ul className="space-y-2">
                  {perRuang.map((r, i) => (
                    <li key={r.nama} className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-muted-foreground w-5">
                        {i + 1}.
                      </span>
                      <span className="flex-1 text-sm">{r.nama}</span>
                      <span className="text-sm font-semibold">{r.jumlah}x</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <StatCard
              icon={<ShieldCheck className="h-5 w-5" />}
              label="Menunggu persetujuan Anda"
              value={persetujuan.length}
              to="/persetujuan"
              cta="Buka antrean"
            />
            {user.roleNama === "ga" && (
              <StatCard
                icon={<Moon className="h-5 w-5" />}
                label="Pengajuan di luar jam kerja"
                value={
                  persetujuan.filter((b) => b.diLuarJamKerja).length
                }
                to="/persetujuan"
                cta="Periksa"
              />
            )}
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Pengajuan tertua menunggu Anda</CardTitle>
              <button
                onClick={() => navigate("/persetujuan")}
                className="text-sm text-primary hover:underline"
              >
                Buka antrean
              </button>
            </CardHeader>
            <CardContent>
              {persetujuan.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-8 w-8" />}
                  title="Tidak ada antrean"
                  description="Saat ada pengajuan baru, akan muncul di sini."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {persetujuan
                    .slice()
                    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
                    .slice(0, 5)
                    .map((b) => (
                      <li
                        key={b.id}
                        onClick={() => navigate(`/persetujuan?detail=${b.id}`)}
                        className="py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{b.judulKegiatan}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {b.pemohon?.nama} · {b.resource?.nama} ·{" "}
                            {formatTanggalPendek(b.tanggal)} {b.jamMulai}–
                            {b.jamSelesai}
                          </p>
                        </div>
                        {b.diLuarJamKerja && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Moon className="h-3 w-3" /> Di luar jam kerja
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  to,
  cta,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  to?: string;
  cta?: string;
}) {
  return (
    <button
      onClick={() => to && navigate(to)}
      disabled={!to}
      className={`text-left bg-card border border-border rounded-xl p-4 transition-shadow ${
        to ? "hover:shadow-md cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="grid place-items-center h-10 w-10 rounded-lg bg-accent text-accent-foreground">
          {icon}
        </div>
        {to && (
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {cta && to && (
        <p className="text-xs text-primary mt-2 font-medium">{cta} →</p>
      )}
    </button>
  );
}

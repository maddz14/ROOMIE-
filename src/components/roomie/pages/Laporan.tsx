"use client";

import { useEffect, useState } from "react";
import { api, apiBlob } from "../api";
import { useMeta } from "../meta";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loading, PageHeader, StatusBadge, EmptyState, formatTanggalPendek } from "../ui-bits";
import { Download, Filter, BarChart3 } from "lucide-react";

type Ringkasan = {
  total: number;
  disetujui: number;
  ditolak: number;
  dibatalkan: number;
  selesai: number;
  berlangsung: number;
  menunggu: number;
  kerusakan: number;
};
type Row = any;

export function Laporan() {
  const { meta } = useMeta();
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [ruang, setRuang] = useState("semua");
  const [tipe, setTipe] = useState("semua");
  const [status, setStatus] = useState("semua");
  const [ruangList, setRuangList] = useState<{ id: number; nama: string }[]>([]);
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
  const [perRuang, setPerRuang] = useState<{ nama: string; jumlah: number }[]>([]);
  const [perBulan, setPerBulan] = useState<{ bulan: string; jumlah: number }[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    (async () => {
      const d = await api<{ ruang: any[] }>("/api/ruang");
      setRuangList(d.ruang.map((r) => ({ id: r.id, nama: r.nama })));
    })();
  }, []);

  async function terapkan() {
    setLoading(true);
    setApplied(true);
    const qs = new URLSearchParams();
    if (dari) qs.set("dari", dari);
    if (sampai) qs.set("sampai", sampai);
    if (ruang !== "semua") qs.set("ruang", ruang);
    if (tipe !== "semua") qs.set("tipe", tipe);
    if (status !== "semua") qs.set("status", status);
    const q = qs.toString();
    try {
      const [r, d] = await Promise.all([
        api<any>(`/api/laporan/ringkasan${q ? `?${q}` : ""}`),
        api<{ data: Row[] }>(`/api/laporan/data${q ? `?${q}` : ""}`),
      ]);
      setRingkasan(r.ringkasan);
      setPerRuang(r.perRuang);
      setPerBulan(r.perBulan);
      setRows(d.data);
    } finally {
      setLoading(false);
    }
  }

  async function unduhCsv() {
    try {
      const qs = new URLSearchParams();
      if (dari) qs.set("dari", dari);
      if (sampai) qs.set("sampai", sampai);
      if (ruang !== "semua") qs.set("ruang", ruang);
      if (tipe !== "semua") qs.set("tipe", tipe);
      if (status !== "semua") qs.set("status", status);
      const { blob, filename } = await apiBlob(
        `/api/laporan/csv${qs.toString() ? `?${qs.toString()}` : ""}`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV diunduh.");
    } catch (e: any) {
      toast.error(e.message || "Gagal mengunduh.");
    }
  }

  const maxRuang = Math.max(1, ...perRuang.map((r) => r.jumlah));
  const maxBulan = Math.max(1, ...perBulan.map((r) => r.jumlah));

  return (
    <div>
      <PageHeader
        title="Laporan"
        description="Rekap penggunaan ruang per periode. Unduh sebagai CSV."
      />

      {/* Filter */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Dari Tanggal</label>
            <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Sampai Tanggal</label>
            <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Ruang</label>
            <Select value={ruang} onValueChange={setRuang}>
              <SelectTrigger><SelectValue placeholder="Semua ruang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua ruang</SelectItem>
                {ruangList.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Jenis Ruang</label>
            <Select value={tipe} onValueChange={setTipe}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua</SelectItem>
                {meta.tipeRuang.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua</SelectItem>
                <SelectItem value="menunggu_kemahasiswaan">Menunggu Kemahasiswaan</SelectItem>
                <SelectItem value="menunggu_ga">Menunggu GA</SelectItem>
                <SelectItem value="disetujui">Disetujui</SelectItem>
                <SelectItem value="ditolak">Ditolak</SelectItem>
                <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                <SelectItem value="berlangsung">Berlangsung</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={terapkan} disabled={loading}>
            <Filter className="h-4 w-4 mr-1.5" /> {loading ? "Memuat..." : "Terapkan"}
          </Button>
          <Button variant="outline" onClick={unduhCsv}>
            <Download className="h-4 w-4 mr-1.5" /> Unduh CSV
          </Button>
        </div>
      </div>

      {!applied && !loading ? (
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" />}
          title="Pilih filter lalu tekan Terapkan"
          description="Atur periode dan ruang untuk melihat ringkasan dan tabel rinci."
          action={<Button onClick={terapkan}>Tampilkan semua</Button>}
        />
      ) : loading ? (
        <Loading />
      ) : (
        <>
          {/* Ringkasan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 mb-5">
            <Stat label="Total" value={ringkasan?.total ?? 0} />
            <Stat label="Disetujui" value={ringkasan?.disetujui ?? 0} tone="emerald" />
            <Stat label="Ditolak" value={ringkasan?.ditolak ?? 0} tone="red" />
            <Stat label="Dibatalkan" value={ringkasan?.dibatalkan ?? 0} tone="gray" />
            <Stat label="Selesai" value={ringkasan?.selesai ?? 0} tone="teal" />
            <Stat label="Berlangsung" value={ringkasan?.berlangsung ?? 0} tone="blue" />
            <Stat label="Kerusakan" value={ringkasan?.kerusakan ?? 0} tone="amber" />
          </div>

          {/* Grafik batang sederhana */}
          <div className="grid lg:grid-cols-2 gap-4 mb-5">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">Penggunaan per Ruang</h3>
              {perRuang.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data.</p>
              ) : (
                <ul className="space-y-2.5">
                  {perRuang.slice(0, 8).map((r) => (
                    <li key={r.nama}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="truncate pr-2">{r.nama}</span>
                        <span className="font-semibold">{r.jumlah}x</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(r.jumlah / maxRuang) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">Penggunaan per Bulan</h3>
              {perBulan.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data.</p>
              ) : (
                <div className="flex items-end gap-2 h-40">
                  {perBulan.map((b) => (
                    <div key={b.bulan} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-primary/80"
                        style={{ height: `${(b.jumlah / maxBulan) * 100}%`, minHeight: 4 }}
                        title={`${b.jumlah} pengajuan`}
                      />
                      <span className="text-[10px] text-muted-foreground -rotate-0">
                        {b.bulan.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabel rinci */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto roomie-scroll">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <Th>Kode</Th>
                    <Th>Tanggal</Th>
                    <Th>Ruang</Th>
                    <Th>Pemohon</Th>
                    <Th>Kegiatan</Th>
                    <Th>Peserta</Th>
                    <Th>Status</Th>
                    <Th>Jam Masuk</Th>
                    <Th>Jam Keluar</Th>
                    <Th>Kondisi</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-muted-foreground">
                        Tidak ada data pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30">
                        <Td className="font-mono text-xs">{r.kodeBooking}</Td>
                        <Td>{formatTanggalPendek(r.tanggal)}</Td>
                        <Td>{r.resource?.nama}</Td>
                        <Td>{r.pemohon?.nama}</Td>
                        <Td className="max-w-[180px] truncate" title={r.judulKegiatan}>{r.judulKegiatan}</Td>
                        <Td>{r.jumlahPeserta}</Td>
                        <Td><StatusBadge status={r.status} /></Td>
                        <Td>{r.usageLog?.checkInAt || "-"}</Td>
                        <Td>{r.usageLog?.checkOutAt || "-"}</Td>
                        <Td>
                          {r.usageLog?.kondisi
                            ? r.usageLog.kondisi === "baik"
                              ? "Baik"
                              : "Rusak"
                            : "-"}
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "emerald" | "red" | "gray" | "teal" | "blue" | "amber";
}) {
  const tones: Record<string, string> = {
    default: "bg-card border-border",
    emerald: "bg-emerald-50 border-emerald-200",
    red: "bg-red-50 border-red-200",
    gray: "bg-slate-50 border-slate-200",
    teal: "bg-teal-50 border-teal-200",
    blue: "bg-blue-50 border-blue-200",
    amber: "bg-amber-50 border-amber-200",
  };
  return (
    <div className={`border rounded-xl p-3 ${tones[tone]}`}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className}`}>{children}</td>;
}

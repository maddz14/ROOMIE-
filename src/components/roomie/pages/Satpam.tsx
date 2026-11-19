"use client";

import { useEffect, useState } from "react";
import { navigate } from "../router";
import { api } from "../api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Loading,
  PageHeader,
  StatusBadge,
  EmptyState,
  formatTanggalPanjang,
} from "../ui-bits";
import {
  Search,
  LogIn,
  LogOut,
  Key,
  Power,
  Building2,
  User,
  Phone,
  QrCode,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

type Booking = any;

export function Satpam() {
  const [list, setList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [kode, setKode] = useState("");
  const [hasScanner, setHasScanner] = useState(false);
  const [checkout, setCheckout] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  // checkout form
  const [kondisi, setKondisi] = useState<"baik" | "ada_kerusakan">("baik");
  const [catatanRusak, setCatatanRusak] = useState("");
  const [kunci, setKunci] = useState(false);
  const [perangkat, setPerangkat] = useState(false);
  const [catatanPetugas, setCatatanPetugas] = useState("");

  async function load() {
    setLoading(true);
    try {
      const d = await api<{ bookings: Booking[] }>("/api/satpam/hari-ini");
      setList(d.bookings);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // deteksi BarcodeDetector
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      setHasScanner(true);
    }
  }, []);

  async function cari(e: React.FormEvent) {
    e.preventDefault();
    if (!kode.trim()) return;
    try {
      const d = await api<{ booking: Booking }>(
        `/api/satpam/cari?kode=${encodeURIComponent(kode.trim())}`,
      );
      navigate(`/pengajuan/${d.booking.id}`);
    } catch (e: any) {
      toast.error(e.message || "Booking tidak ditemukan.");
    }
  }

  async function doCheckIn(id: number) {
    setBusy(true);
    try {
      await api(`/api/booking/${id}/check-in`, { method: "POST" });
      toast.success("Check-in berhasil. Status: Sedang Berlangsung.");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Check-in gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function doCheckOut() {
    if (!checkout) return;
    if (!kunci || !perangkat) {
      toast.error("Centang kunci dikembalikan dan perangkat dimatikan.");
      return;
    }
    if (kondisi === "ada_kerusakan" && catatanRusak.trim().length < 3) {
      toast.error("Keterangan kerusakan wajib diisi.");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/booking/${checkout.id}/check-out`, {
        method: "POST",
        body: {
          kondisi,
          catatanKerusakan: catatanRusak || undefined,
          kunciDikembalikan: kunci,
          perangkatDimatikan: perangkat,
          catatanPetugas: catatanPetugas || undefined,
        },
      });
      toast.success("Check-out berhasil. Ruang selesai digunakan.");
      setCheckout(null);
      setKondisi("baik");
      setCatatanRusak("");
      setKunci(false);
      setPerangkat(false);
      setCatatanPetugas("");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Check-out gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Jadwal Hari Ini"
        description="Daftar peminjaman yang berstatus Disetujui atau Sedang Berlangsung hari ini."
      />

      {/* Pencarian */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5">
        <form onSubmit={cari} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              placeholder="Ketik kode booking (mis. CWE-FORM-2026-00001) lalu Enter"
              className="pl-9"
            />
          </div>
          <Button type="submit">Cari</Button>
        </form>
        {!hasScanner ? (
          <p className="text-xs text-muted-foreground mt-2">
            Ketik kode booking untuk mencari. Pemindai QR tidak tersedia di
            peramban ini.
          </p>
        ) : (
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => toast.info("Pemindai QR segera hadir. Untuk sementara, ketik kode booking.")}
          >
            <QrCode className="h-4 w-4 mr-1.5" /> Pindai QR
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-2">
        {formatTanggalPanjang(new Date().toISOString().slice(0, 10))}
      </p>

      {loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-8 w-8" />}
          title="Tidak ada jadwal hari ini"
          description="Semua ruang bebas atau belum ada yang disetujui untuk hari ini."
        />
      ) : (
        <ul className="space-y-3">
          {list.map((b) => (
            <li
              key={b.id}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">
                    {b.kodeBooking}
                  </p>
                  <p className="font-semibold truncate mt-0.5">{b.judulKegiatan}</p>
                  <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                    <p className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {b.resource?.nama} · {b.jamMulai}–{b.jamSelesai}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {b.pemohon?.nama} · PJ: {b.penanggungJawab}
                    </p>
                    {b.pemohon?.noHp && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {b.pemohon.noHp}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={b.status} />
                  {b.status === "disetujui" ? (
                    <Button
                      size="sm"
                      onClick={() => doCheckIn(b.id)}
                      disabled={busy}
                    >
                      <LogIn className="h-4 w-4 mr-1" /> Check-in
                    </Button>
                  ) : b.status === "berlangsung" ? (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setCheckout(b);
                        setKondisi("baik");
                        setCatatanRusak("");
                        setKunci(false);
                        setPerangkat(false);
                        setCatatanPetugas("");
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-1" /> Check-out
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal check-out */}
      <Dialog open={!!checkout} onOpenChange={(o) => !o && setCheckout(null)}>
        <DialogContent className="max-w-md">
          {checkout && (
            <>
              <DialogHeader>
                <DialogTitle>Check-out Penggunaan Ruang</DialogTitle>
                <DialogDescription>
                  {checkout.kodeBooking} — {checkout.resource?.nama}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Checklist Wajib</Label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--primary)]"
                      checked={perangkat}
                      onChange={(e) => setPerangkat(e.target.checked)}
                    />
                    <Power className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Proyektor dan AC sudah dimatikan</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--primary)]"
                      checked={kunci}
                      onChange={(e) => setKunci(e.target.checked)}
                    />
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Kunci sudah dikembalikan</span>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Kondisi Ruang</Label>
                  <RadioGroup
                    value={kondisi}
                    onValueChange={(v) => setKondisi(v as any)}
                    className="flex gap-3"
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 px-3 h-10 rounded-lg border border-border has-[:checked]:border-primary has-[:checked]:bg-accent">
                      <RadioGroupItem value="baik" />
                      <span className="text-sm">Baik</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer flex-1 px-3 h-10 rounded-lg border border-border has-[:checked]:border-primary has-[:checked]:bg-accent">
                      <RadioGroupItem value="ada_kerusakan" />
                      <span className="text-sm">Ada kerusakan</span>
                    </label>
                  </RadioGroup>
                </div>

                {kondisi === "ada_kerusakan" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-red-700 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Keterangan Kerusakan
                      / Kehilangan
                    </Label>
                    <Textarea
                      value={catatanRusak}
                      onChange={(e) => setCatatanRusak(e.target.value)}
                      placeholder="Jelaskan kerusakan atau kehilangan..."
                      rows={3}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Catatan Petugas (opsional)</Label>
                  <Textarea
                    value={catatanPetugas}
                    onChange={(e) => setCatatanPetugas(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCheckout(null)}>
                  Batal
                </Button>
                <Button onClick={doCheckOut} disabled={busy}>
                  {busy ? "Memproses..." : "Selesaikan"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

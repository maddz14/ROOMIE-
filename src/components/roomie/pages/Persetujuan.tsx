"use client";

import { useEffect, useState } from "react";
import { navigate, useRoute } from "../router";
import { useAuth } from "../auth";
import { api } from "../api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Loading,
  PageHeader,
  StatusBadge,
  EmptyState,
  formatTanggalPendek,
  relativeTime,
} from "../ui-bits";
import {
  CheckCircle2,
  XCircle,
  Moon,
  Building2,
  ShieldCheck,
  FileText,
} from "lucide-react";

type Booking = any;

export function Persetujuan() {
  const { user } = useAuth();
  const route = useRoute();
  const [tab, setTab] = useState<"menunggu" | "riwayat">("menunggu");
  const [list, setList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [alasan, setAlasan] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [showTolak, setShowTolak] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await api<{ bookings: Booking[] }>(
        `/api/persetujuan?tab=${tab}`,
      );
      setList(d.bookings);
      // bila ada ?detail=ID, buka drawer
      const did = route.query.get("detail");
      if (did) {
        const b = d.bookings.find((x) => String(x.id) === did);
        if (b) setDetail(b);
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [tab]);

  async function putuskan(keputusan: "disetujui" | "ditolak") {
    if (!detail) return;
    if (keputusan === "ditolak" && alasan.trim().length < 5) {
      toast.error("Tuliskan alasan penolakan (min. 5 karakter).");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/booking/${detail.id}/keputusan`, {
        method: "POST",
        body:
          keputusan === "ditolak"
            ? { keputusan, alasan }
            : { keputusan },
      });
      toast.success(
        keputusan === "disetujui"
          ? user?.roleNama === "kemahasiswaan"
            ? "Pengajuan diteruskan ke GA."
            : "Pengajuan disetujui."
          : "Pengajuan ditolak dan pemohon diberi tahu.",
      );
      setDetail(null);
      setAlasan("");
      setConfirmApprove(false);
      setShowTolak(false);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Keputusan gagal diproses.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Persetujuan"
        description={
          user?.roleNama === "kemahasiswaan"
            ? "Antrean tahap 1 — verifikasi Kemahasiswaan."
            : "Antrean tahap 2 — persetujuan GA."
        }
      />

      <div className="inline-flex p-1 bg-muted rounded-xl mb-5">
        {[
          { v: "menunggu", l: "Menunggu" },
          { v: "riwayat", l: "Riwayat Saya" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v as any)}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
              tab === t.v
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-8 w-8" />}
          title={
            tab === "menunggu"
              ? "Antrean kosong"
              : "Belum ada riwayat keputusan"
          }
          description={
            tab === "menunggu"
              ? "Saat ada pengajuan baru menunggu Anda, akan muncul di sini."
              : "Keputusan yang telah Anda buat akan tercatat di sini."
          }
        />
      ) : (
        <ul className="space-y-3">
          {list.map((b) => (
            <li
              key={b.id}
              onClick={() => {
                setDetail(b);
                setAlasan("");
              }}
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {b.pemohon?.nama}
                    {b.pemohon?.unit ? ` · ${b.pemohon.unit}` : ""} ·{" "}
                    diajukan {relativeTime(b.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusBadge status={b.status} />
                  {b.diLuarJamKerja && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      <Moon className="h-3 w-3" /> Di luar jam kerja
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Drawer detail + aksi */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto roomie-scroll">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8">{detail.judulKegiatan}</DialogTitle>
                <DialogDescription className="font-mono">
                  {detail.kodeBooking}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <Info k="Pemohon" v={detail.pemohon?.nama || "-"} />
                  <Info k="Unit" v={detail.pemohon?.unit || "-"} />
                  <Info k="No. HP" v={detail.pemohon?.noHp || "-"} />
                  <Info k="Email" v={detail.pemohon?.email || "-"} />
                  <Info k="Ruang" v={detail.resource?.nama || "-"} />
                  <Info k="Tanggal" v={formatTanggalPendek(detail.tanggal)} />
                  <Info k="Jam" v={`${detail.jamMulai}–${detail.jamSelesai}`} />
                  <Info k="Peserta" v={`${detail.jumlahPeserta} orang`} />
                  <Info k="Penanggung Jawab" v={detail.penanggungJawab} />
                  <Info k="Jenis" v={detail.jenisLabel} />
                </div>
                {detail.diLuarJamKerja && (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <Moon className="h-3 w-3" /> Pengajuan di luar jam kerja
                  </p>
                )}
                {detail.catatanPemohon && (
                  <div>
                    <p className="text-xs text-muted-foreground">Catatan pemohon</p>
                    <p>{detail.catatanPemohon}</p>
                  </div>
                )}
                {detail.facilities?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fasilitas diminta</p>
                    <ul className="space-y-0.5">
                      {detail.facilities.map((f: any) => (
                        <li key={f.facilityId}>
                          {f.nama}: {f.jumlah} {f.satuan}
                          {f.keterangan ? ` — ${f.keterangan}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {detail.documents?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Dokumen</p>
                    <ul className="space-y-0.5">
                      {detail.documents.map((d: any) => (
                        <li key={d.id}>
                          <a
                            href={`/api/dokumen/${d.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3.5 w-3.5" /> {d.namaFile}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {tab === "menunggu" && (
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10 sm:mr-auto"
                    onClick={() => setShowTolak(true)}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> Tolak
                  </Button>
                  <Button onClick={() => setConfirmApprove(true)}>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Setujui
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Konfirmasi setujui */}
      <Dialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Setujui pengajuan ini?</DialogTitle>
            <DialogDescription>
              Pengajuan akan{" "}
              {user?.roleNama === "kemahasiswaan"
                ? "diteruskan ke GA"
                : "disetujui dan pemohon diberi tahu"}
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmApprove(false)}>
              Batal
            </Button>
            <Button onClick={() => putuskan("disetujui")} disabled={busy}>
              {busy ? "Memproses..." : "Ya, Setujui"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form tolak */}
      <Dialog open={showTolak} onOpenChange={setShowTolak}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak pengajuan</DialogTitle>
            <DialogDescription>
              Tuliskan alasan agar pemohon dapat memperbaiki dan mengajukan ulang.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Alasan penolakan (min. 5 karakter)..."
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {alasan.length}/500
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTolak(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => putuskan("ditolak")}
              disabled={busy}
            >
              {busy ? "Memproses..." : "Tolak Pengajuan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className="font-medium break-words">{v}</p>
    </div>
  );
}

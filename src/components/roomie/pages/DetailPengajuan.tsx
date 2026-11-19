"use client";

import { useEffect, useState } from "react";
import { navigate } from "../router";
import { useAuth } from "../auth";
import { api } from "../api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loading, PageHeader, StatusBadge, EmptyState, formatTanggalPendek, formatWaktu } from "../ui-bits";
import {
  Building2,
  Users,
  User,
  CalendarDays,
  Clock,
  Check,
  XCircle,
  Printer,
  Ban,
  FileText,
  Moon,
  AlertTriangle,
  Key,
  Power,
} from "lucide-react";

type Booking = any;

export function DetailPengajuan({ id }: { id: string }) {
  const { user } = useAuth();
  const [b, setB] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [alasanBatal, setAlasanBatal] = useState("");

  async function load() {
    setLoading(true);
    try {
      const d = await api<{ booking: Booking }>(`/api/booking/${id}`);
      setB(d.booking);
    } catch {
      setB(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [id]);

  async function batalkan() {
    if (alasanBatal.trim().length < 3) {
      toast.error("Tuliskan alasan pembatalan singkat.");
      return;
    }
    try {
      await api(`/api/booking/${id}/batal`, {
        method: "POST",
        body: { alasan: alasanBatal },
      });
      toast.success("Pengajuan dibatalkan.");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Pembatalan gagal.");
    }
  }

  if (loading) return <Loading />;
  if (!b)
    return (
      <EmptyState
        icon={<XCircle className="h-8 w-8" />}
        title="Pengajuan tidak ditemukan"
        description="Mungkin Anda tidak memiliki akses, atau pengajuan telah dihapus."
        action={
          <Button onClick={() => navigate("/pengajuan")}>Kembali</Button>
        }
      />
    );

  const isOwner = user?.id === b.pemohon?.id;
  const isPeminjam = user?.roleNama === "peminjam";
  const showQR =
    b.status === "disetujui" || b.status === "berlangsung" || b.status === "selesai";

  // Stepper state
  const tahap1 = b.approvals?.find((a: any) => a.tahap === 1);
  const tahap2 = b.approvals?.find((a: any) => a.tahap === 2);
  const steps = [
    { key: "diajukan", label: "Diajukan", state: "done" },
    {
      key: "kem",
      label: "Kemahasiswaan",
      state: stepperState("kem", b, tahap1),
    },
    { key: "ga", label: "GA", state: stepperState("ga", b, tahap2) },
    {
      key: "disetujui",
      label: "Disetujui",
      state: stepperState("approved", b, null),
    },
    { key: "selesai", label: "Selesai", state: stepperState("done", b, null) },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-1 text-sm">
        <button
          onClick={() => navigate(isPeminjam ? "/pengajuan" : user?.roleNama === "satpam" ? "/satpam" : "/persetujuan")}
          className="text-muted-foreground hover:text-foreground"
        >
          ‹ Kembali
        </button>
      </div>
      <PageHeader
        title={b.judulKegiatan}
        description={
          <span className="font-mono text-sm text-muted-foreground">
            {b.kodeBooking}
          </span>
        }
        action={<StatusBadge status={b.status} />}
      />

      {b.status === "dibatalkan" && (
        <div className="mb-5 rounded-xl border border-border bg-muted/50 p-4 flex items-start gap-3">
          <Ban className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Pengajuan Dibatalkan</p>
            {b.alasanPembatalan && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Alasan: {b.alasanPembatalan}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="bg-card border border-border rounded-xl p-5 mb-5">
        <div className="roomie-stepper">
          {steps.map((s) => (
            <div key={s.key} className={`step ${s.state}`}>
              <div className="ring">
                {s.state === "done" ? (
                  <Check className="h-4 w-4" />
                ) : s.state === "rejected" ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <span>{steps.indexOf(s) + 1}</span>
                )}
              </div>
              <span className="label">{s.label}</span>
            </div>
          ))}
        </div>
        {/* Alasan penolakan */}
        {(b.status === "ditolak" || b.status === "dibatalkan") &&
          (tahap1?.keputusan === "ditolak" || tahap2?.keputusan === "ditolak") && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
              <p className="font-semibold text-red-800 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Ditolak
              </p>
              <p className="text-red-700 mt-1">
                Alasan:{" "}
                {tahap2?.keputusan === "ditolak"
                  ? tahap2.alasan
                  : tahap1?.alasan}
              </p>
            </div>
          )}
      </div>

      {/* QR + kode */}
      {showQR && (
        <div className="bg-card border border-border rounded-xl p-5 mb-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-white p-2 rounded-lg border border-border">
            <img
              src={`/api/booking/${b.id}/qr`}
              alt="QR Code"
              width={120}
              height={120}
            />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">Tunjukkan kepada Satpam</p>
            <p className="font-mono font-bold text-lg text-primary break-all">
              {b.kodeBooking}
            </p>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        {/* Ringkasan */}
        <Card title="Ringkasan">
          <Row icon={<Building2 className="h-4 w-4" />} k="Ruang" v={`${b.resource?.nama} (${b.resource?.kode})`} />
          <Row icon={<CalendarDays className="h-4 w-4" />} k="Tanggal" v={formatTanggalPendek(b.tanggal)} />
          <Row icon={<Clock className="h-4 w-4" />} k="Jam" v={`${b.jamMulai} – ${b.jamSelesai}`} />
          <Row icon={<Users className="h-4 w-4" />} k="Peserta" v={`${b.jumlahPeserta} orang (kap. ${b.resource?.kapasitas || "–"})`} />
          <Row icon={<User className="h-4 w-4" />} k="Penanggung Jawab" v={b.penanggungJawab} />
          <Row icon={<FileText className="h-4 w-4" />} k="Jenis" v={b.jenisLabel} />
          {b.diLuarJamKerja && (
            <p className="text-xs text-amber-700 flex items-center gap-1 mt-1">
              <Moon className="h-3 w-3" /> Di luar jam kerja
            </p>
          )}
          {b.catatanPemohon && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">Catatan</p>
              <p className="text-sm">{b.catatanPemohon}</p>
            </div>
          )}
        </Card>

        {/* Fasilitas */}
        <Card title="Fasilitas">
          {b.facilities?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada fasilitas diminta.</p>
          ) : (
            <ul className="text-sm space-y-1.5">
              {b.facilities.map((f: any) => (
                <li key={f.facilityId} className="flex justify-between gap-2">
                  <span>{f.nama}</span>
                  <span className="text-muted-foreground">
                    {f.jumlah} {f.satuan}
                    {f.keterangan ? ` — ${f.keterangan}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Riwayat keputusan */}
        <Card title="Riwayat Keputusan">
          <ol className="space-y-3">
            <li className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tahap 1 · Kemahasiswaan</span>
              <span className="text-right">
                <DecisionBadge keputusan={tahap1?.keputusan} />
                {tahap1?.approver && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tahap1.approver.nama} · {formatWaktu(tahap1.decidedAt)}
                  </p>
                )}
                {tahap1?.alasan && (
                  <p className="text-xs text-muted-foreground mt-0.5">{tahap1.alasan}</p>
                )}
              </span>
            </li>
            <li className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tahap 2 · GA</span>
              <span className="text-right">
                <DecisionBadge keputusan={tahap2?.keputusan} />
                {tahap2?.approver && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tahap2.approver.nama} · {formatWaktu(tahap2.decidedAt)}
                  </p>
                )}
                {tahap2?.alasan && (
                  <p className="text-xs text-muted-foreground mt-0.5">{tahap2.alasan}</p>
                )}
              </span>
            </li>
          </ol>
        </Card>

        {/* Dokumen */}
        <Card title="Dokumen">
          {b.documents?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada dokumen.</p>
          ) : (
            <ul className="space-y-1.5">
              {b.documents.map((d: any) => (
                <li key={d.id}>
                  <a
                    href={`/api/dokumen/${d.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" /> {d.namaFile}
                  </a>
                  <p className="text-xs text-muted-foreground">{d.uploadedAt}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Pemakaian aktual */}
      {b.usageLog && (
        <Card title="Pemakaian Aktual" className="mb-5">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Row k="Jam Masuk" v={b.usageLog.checkInAt || "-"} />
            <Row k="Jam Keluar" v={b.usageLog.checkOutAt || "-"} />
            <Row k="Kondisi Ruang" v={b.usageLog.kondisi === "baik" ? "Baik" : "Ada kerusakan"} />
            <Row
              k="Kunci Dikembalikan"
              v={b.usageLog.kunciDikembalikan ? "Ya" : "Tidak"}
            />
            <Row
              k="Perangkat Dimatikan"
              v={b.usageLog.perangkatDimatikan ? "Ya" : "Tidak"}
            />
            {b.usageLog.petugas && <Row k="Petugas" v={b.usageLog.petugas.nama} />}
            {b.usageLog.catatanKerusakan && (
              <div className="sm:col-span-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">Keterangan kerusakan</p>
                <p className="text-sm text-red-700">{b.usageLog.catatanKerusakan}</p>
              </div>
            )}
            {b.usageLog.catatanPetugas && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Catatan petugas</p>
                <p className="text-sm">{b.usageLog.catatanPetugas}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Aksi */}
      {isOwner && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate(`/cetak/${b.id}`)} variant="outline">
            <Printer className="h-4 w-4 mr-1.5" /> Cetak Bukti
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={!b.bisaDibatalkan}
                className={
                  b.bisaDibatalkan
                    ? "text-destructive border-destructive hover:bg-destructive/10"
                    : ""
                }
              >
                <Ban className="h-4 w-4 mr-1.5" /> Batalkan
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Batalkan pengajuan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Slot jadwal akan dibebaskan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                value={alasanBatal}
                onChange={(e) => setAlasanBatal(e.target.value)}
                placeholder="Alasan pembatalan..."
                rows={3}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={batalkan}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Ya, Batalkan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {!b.bisaDibatalkan && b.alasanTidakBisaDibatalkan && (
            <p className="text-xs text-muted-foreground self-center">
              {b.alasanTidakBisaDibatalkan}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function stepperState(
  key: string,
  b: any,
  tahap: any,
): "done" | "active" | "rejected" | "" {
  if (key === "kem") {
    if (tahap?.keputusan === "ditolak") return "rejected";
    if (tahap?.keputusan === "disetujui") return "done";
    if (b.status === "menunggu_kemahasiswaan") return "active";
    return "";
  }
  if (key === "ga") {
    if (tahap?.keputusan === "ditolak") return "rejected";
    if (tahap?.keputusan === "disetujui") return "done";
    if (b.status === "menunggu_ga") return "active";
    return "";
  }
  if (key === "approved") {
    if (["disetujui", "berlangsung", "selesai"].includes(b.status)) return "done";
    return "";
  }
  if (key === "done") {
    if (b.status === "selesai") return "done";
    if (b.status === "berlangsung") return "active";
    return "";
  }
  return "";
}

function DecisionBadge({ keputusan }: { keputusan?: string }) {
  if (!keputusan || keputusan === "menunggu")
    return <span className="text-xs text-muted-foreground">Menunggu</span>;
  if (keputusan === "disetujui")
    return (
      <span className="text-xs font-semibold text-emerald-700">Disetujui</span>
    );
  return <span className="text-xs font-semibold text-red-700">Ditolak</span>;
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Row({
  icon,
  k,
  v,
}: {
  icon?: React.ReactNode;
  k: string;
  v: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
        {icon}
        {k}
      </span>
      <span className="text-right break-words">{v}</span>
    </div>
  );
}

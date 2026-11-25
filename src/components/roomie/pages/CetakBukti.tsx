"use client";

import { useEffect, useState } from "react";
import { navigate } from "../router";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Loading, formatTanggalPendek, formatWaktu } from "../ui-bits";
import { KETENTUAN_LIST } from "@/lib/rules";
import { Printer, ArrowLeft } from "lucide-react";

type Booking = any;

export function CetakBukti({ id }: { id: string }) {
  const [b, setB] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await api<{ booking: Booking }>(`/api/booking/${id}`);
        setB(d.booking);
      } catch {
        setB(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Loading />;
  if (!b)
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Bukti tidak ditemukan.</p>
        <Button className="mt-3" onClick={() => navigate("/pengajuan")}>Kembali</Button>
      </div>
    );

  const tahap1 = b.approvals?.find((a: any) => a.tahap === 1);
  const tahap2 = b.approvals?.find((a: any) => a.tahap === 2);

  return (
    <div>
      {/* Toolbar (disembunyikan saat cetak) */}
      <div className="no-print flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate(`/pengajuan/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1.5" /> Cetak / Simpan PDF
        </Button>
      </div>

      <div className="print-area bg-card border border-border rounded-xl p-8 max-w-3xl mx-auto">
        {/* Kop */}
        <div className="flex items-center justify-between border-b-2 border-foreground pb-4 mb-5 gap-4">
          <img src="/logo.png" alt="ROOMIE Logo" className="h-14 w-auto object-contain shrink-0" />
          <div className="text-center flex-1">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              POLITEKNIK KELAPA SAWIT CITRA WIDYA EDUKASI
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Sistem Manajemen Peminjaman Ruang dan Lapangan Kampus (CWE-FORM)
            </p>
          </div>
          <div className="w-14 shrink-0 hidden sm:block" />
        </div>

        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-muted-foreground">Kode Booking</p>
            <p className="font-mono font-bold text-lg">{b.kodeBooking}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-semibold">{b.statusLabel}</p>
          </div>
        </div>

        {/* A. Data Pemohon */}
        <Section title="A. Data Pemohon">
          <Grid>
            <Field k="Nama" v={b.pemohon?.nama} />
            <Field k="NIM/NIP" v={b.pemohon?.nimNip} />
            <Field k="Unit" v={b.pemohon?.unit || "-"} />
            <Field k="Jabatan" v={b.pemohon?.jabatan || "-"} />
            <Field k="No. HP" v={b.pemohon?.noHp || "-"} />
            <Field k="Email" v={b.pemohon?.email || "-"} />
          </Grid>
        </Section>

        {/* B. Data Kegiatan */}
        <Section title="B. Data Kegiatan">
          <Grid>
            <Field k="Judul Kegiatan" v={b.judulKegiatan} span={2} />
            <Field k="Jenis Kegiatan" v={b.jenisLabel} />
            <Field k="Jumlah Peserta" v={`${b.jumlahPeserta} orang`} />
            <Field k="Penanggung Jawab" v={b.penanggungJawab} />
            <Field k="Sifat Penggunaan" v={b.sifatPenggunaan === "sekali_pakai" ? "Sekali Pakai" : "Berkala"} />
            <Field k="Di Luar Jam Kerja" v={b.diLuarJamKerja ? "Ya" : "Tidak"} />
            {b.catatanPemohon && <Field k="Catatan" v={b.catatanPemohon} span={3} />}
          </Grid>
        </Section>

        {/* C. Detail Peminjaman */}
        <Section title="C. Detail Peminjaman">
          <Grid>
            <Field k="Ruang" v={b.resource?.nama} />
            <Field k="Kode Ruang" v={b.resource?.kode} />
            <Field k="Lokasi" v={`${b.resource?.gedung || "-"}${b.resource?.lantai ? ` Lt. ${b.resource.lantai}` : ""}`} />
            <Field k="Tanggal" v={formatTanggalPendek(b.tanggal)} />
            <Field k="Jam Mulai" v={b.jamMulai} />
            <Field k="Jam Selesai" v={b.jamSelesai} />
          </Grid>
        </Section>

        {/* D. Kebutuhan Fasilitas */}
        <Section title="D. Kebutuhan Fasilitas">
          <table className="w-full text-sm border border-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-1.5 text-left">No.</th>
                <th className="px-2 py-1.5 text-left">Fasilitas</th>
                <th className="px-2 py-1.5 text-left">Jumlah</th>
                <th className="px-2 py-1.5 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {b.facilities?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-2 text-center text-muted-foreground">
                    Tidak ada fasilitas diminta.
                  </td>
                </tr>
              ) : (
                b.facilities.map((f: any, i: number) => (
                  <tr key={f.facilityId} className="border-t border-border">
                    <td className="px-2 py-1.5">{i + 1}.</td>
                    <td className="px-2 py-1.5">{f.nama}</td>
                    <td className="px-2 py-1.5">{f.jumlah} {f.satuan}</td>
                    <td className="px-2 py-1.5">{f.keterangan || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Section>

        {/* E. Ketentuan */}
        <Section title="E. Ketentuan Penggunaan Ruang">
          <ol className="list-decimal list-inside text-sm space-y-1">
            {KETENTUAN_LIST.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ol>
        </Section>

        {/* F. Pengesahan */}
        <Section title="F. Pengesahan">
          <div className="grid grid-cols-2 gap-6 mt-3">
            <div className="text-center">
              <p className="font-semibold">Mengetahui,</p>
              <p className="text-sm text-muted-foreground">Kabag Kemahasiswaan</p>
              {tahap1?.keputusan === "disetujui" && (
                <p className="mt-16 font-semibold underline">{tahap1.approver?.nama || "-"}</p>
              )}
              {tahap1?.keputusan === "disetujui" && (
                <p className="text-xs text-muted-foreground">
                  {formatWaktu(tahap1.decidedAt)}
                </p>
              )}
              {tahap1?.keputusan === "ditolak" && (
                <p className="mt-12 text-red-700 text-sm">Ditolak</p>
              )}
              {tahap1?.keputusan === "menunggu" && (
                <p className="mt-12 text-muted-foreground text-sm">(Menunggu)</p>
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold">Menyetujui,</p>
              <p className="text-sm text-muted-foreground">Kabag Umum/Sarpras</p>
              {tahap2?.keputusan === "disetujui" && (
                <p className="mt-16 font-semibold underline">{tahap2.approver?.nama || "-"}</p>
              )}
              {tahap2?.keputusan === "disetujui" && (
                <p className="text-xs text-muted-foreground">
                  {formatWaktu(tahap2.decidedAt)}
                </p>
              )}
              {tahap2?.keputusan === "ditolak" && (
                <p className="mt-12 text-red-700 text-sm">Ditolak</p>
              )}
              {tahap2?.keputusan === "menunggu" && (
                <p className="mt-12 text-muted-foreground text-sm">(Menunggu)</p>
              )}
            </div>
          </div>
        </Section>

        {/* Kondisi setelah pemakaian */}
        {b.usageLog && (
          <Section title="G. Kondisi Setelah Pemakaian">
            <Grid>
              <Field k="Jam Masuk" v={b.usageLog.checkInAt || "-"} />
              <Field k="Jam Keluar" v={b.usageLog.checkOutAt || "-"} />
              <Field k="Kondisi Ruang" v={b.usageLog.kondisi === "baik" ? "Baik" : "Ada Kerusakan"} />
              <Field k="Kunci Dikembalikan" v={b.usageLog.kunciDikembalikan ? "Ya" : "Tidak"} />
              <Field k="Perangkat Dimatikan" v={b.usageLog.perangkatDimatikan ? "Ya" : "Tidak"} />
              {b.usageLog.catatanKerusakan && (
                <Field k="Keterangan Kerusakan" v={b.usageLog.catatanKerusakan} span={3} />
              )}
              {b.usageLog.catatanPetugas && (
                <Field k="Catatan Petugas" v={b.usageLog.catatanPetugas} span={3} />
              )}
            </Grid>
          </Section>
        )}

        {/* QR */}
        <div className="mt-6 flex items-center gap-4">
          <img
            src={`/api/booking/${b.id}/qr`}
            alt="QR"
            width={90}
            height={90}
          />
          <div className="text-sm">
            <p>Pindai kode untuk memverifikasi di Satpam.</p>
            <p className="font-mono">{b.kodeBooking}</p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Dicetak melalui ROOMIE · {formatWaktu(new Date().toISOString())}
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="font-bold text-sm mb-2 border-b border-border pb-1">{title}</h2>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">{children}</div>;
}
function Field({
  k,
  v,
  span = 1,
}: {
  k: string;
  v: string | null | undefined;
  span?: 1 | 2 | 3;
}) {
  const cls = span === 2 ? "sm:col-span-2" : span === 3 ? "sm:col-span-3 col-span-2" : "";
  return (
    <div className={cls}>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{k}</p>
      <p className="text-sm font-medium break-words">{v || "-"}</p>
    </div>
  );
}

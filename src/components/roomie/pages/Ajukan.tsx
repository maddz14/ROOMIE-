"use client";

import { useEffect, useState, useMemo } from "react";
import { navigate, useRoute } from "../router";
import { useAuth } from "../auth";
import { useMeta } from "../meta";
import { api } from "../api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Moon,
  Upload,
  X,
  Check,
  Building2,
} from "lucide-react";
import { Loading, PageHeader, FieldError, InfoNote, formatTanggalPendek } from "../ui-bits";

type Ruang = any;
type Ketersediaan = {
  tersedia: boolean;
  bentrok: { judul: string; mulai: string; selesai: string } | null;
  diLuarJamKerja: boolean;
  minimalTanggal: string;
  jamValid: boolean;
  jamError: string | null;
  saran: { mulai: string; selesai: string }[];
};

export function Ajukan() {
  const route = useRoute();
  const { user } = useAuth();
  const { meta } = useMeta();

  const [step, setStep] = useState(1);
  const [ruangList, setRuangList] = useState<Ruang[]>([]);
  const [ruang, setRuang] = useState<Ruang | null>(null);
  const [tanggal, setTanggal] = useState(route.query.get("tanggal") || "");
  const [jamMulai, setJamMulai] = useState(route.query.get("mulai") || "");
  const [jamSelesai, setJamSelesai] = useState("");
  const [ketersediaan, setKetersediaan] = useState<Ketersediaan | null>(null);
  const [ketLoading, setKetLoading] = useState(false);

  // step 2
  const [judul, setJudul] = useState("");
  const [jenis, setJenis] = useState("");
  const [peserta, setPeserta] = useState<number | "">("");
  const [pj, setPj] = useState(user?.nama || "");
  const [catatan, setCatatan] = useState("");

  // step 3
  const [fasilitas, setFasilitas] = useState<
    Record<number, { jumlah: number; keterangan: string; dipakai: boolean }>
  >({});
  const [dokumen, setDokumen] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // step 4
  const [setuju, setSetuju] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sukses, setSukses] = useState<{ id: number; kode: string } | null>(null);
  const [stepErr, setStepErr] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const d = await api<{ ruang: Ruang[] }>("/api/ruang");
      setRuangList(d.ruang);
      const rid = route.query.get("ruang");
      if (rid) {
        const r = d.ruang.find((x) => String(x.id) === rid);
        if (r) setRuang(r);
      }
    })();
  }, []);

  // init fasilitas saat ruang dipilih
  useEffect(() => {
    if (ruang) {
      const init: Record<number, { jumlah: number; keterangan: string; dipakai: boolean }> = {};
      ruang.fasilitas.forEach((f: any) => {
        init[f.facilityId] = { jumlah: 1, keterangan: "", dipakai: false };
      });
      setFasilitas(init);
    }
  }, [ruang]);

  // cek ketersediaan saat step 1 lengkap
  useEffect(() => {
    if (!ruang || !tanggal || !jamMulai || !jamSelesai) {
      setKetersediaan(null);
      return;
    }
    let active = true;
    setKetLoading(true);
    const t = setTimeout(async () => {
      try {
        const d = await api<Ketersediaan>(
          `/api/ruang/${ruang.id}/ketersediaan?tanggal=${tanggal}&mulai=${jamMulai}&selesai=${jamSelesai}`,
        );
        if (active) setKetersediaan(d);
      } catch (e: any) {
        if (active)
          setKetersediaan({
            tersedia: false,
            bentrok: null,
            diLuarJamKerja: false,
            minimalTanggal: "",
            jamValid: true,
            jamError: e.message,
            saran: [],
          });
      } finally {
        if (active) setKetLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [ruang, tanggal, jamMulai, jamSelesai]);

  const step1Valid =
    !!ruang &&
    !!tanggal &&
    /^\d{2}:\d{2}$/.test(jamMulai) &&
    /^\d{2}:\d{2}$/.test(jamSelesai) &&
    jamSelesai > jamMulai &&
    !!ketersediaan?.jamValid;

  function gotoStep(n: number) {
    setStep(n);
  }

  async function handleSubmit() {
    if (!ruang || !user) return;
    if (!setuju) {
      toast.error("Centang persetujuan ketentuan terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    try {
      const fList = Object.entries(fasilitas)
        .filter(([, v]) => v.dipakai)
        .map(([facilityId, v]) => ({
          facilityId: parseInt(facilityId, 10),
          jumlah: v.jumlah,
          keterangan: v.keterangan || undefined,
        }));
      const d = await api<{ booking: any }>("/api/booking", {
        method: "POST",
        body: {
          resourceId: ruang.id,
          judulKegiatan: judul,
          jenisKegiatan: jenis,
          jumlahPeserta: peserta,
          penanggungJawab: pj,
          tanggal,
          jamMulai,
          jamSelesai,
          sifatPenggunaan: "sekali_pakai",
          catatanPemohon: catatan,
          fasilitas: fList,
          setujuKetentuan: true,
        },
      });
      // unggah dokumen bila ada
      if (dokumen && d.booking?.id) {
        try {
          const fd = new FormData();
          fd.append("file", dokumen);
          await api(`/api/booking/${d.booking.id}/dokumen`, {
            method: "POST",
            formData: fd,
          });
        } catch (e: any) {
          toast.warning("Pengajuan terkirim, namun unggah dokumen gagal: " + e.message);
        }
      }
      setSukses({ id: d.booking.id, kode: d.booking.kodeBooking });
    } catch (e: any) {
      toast.error(e.message || "Pengajuan gagal.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sukses) {
    return (
      <div className="max-w-md mx-auto text-center py-10">
        <div className="grid place-items-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto mb-4">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-bold">Pengajuan Terkirim</h1>
        <p className="text-muted-foreground mt-1">
          Pengajuan Anda diteruskan ke Kemahasiswaan untuk diverifikasi.
        </p>
        <div className="my-6 p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground">Kode Booking</p>
          <p className="text-2xl font-mono font-bold text-primary break-all">
            {sukses.kode}
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => navigate(`/pengajuan/${sukses.id}`)}>
            Lihat Status
          </Button>
          <Button onClick={() => {
            setSukses(null);
            setStep(1);
            setRuang(null);
            setTanggal("");
            setJamMulai("");
            setJamSelesai("");
            setJudul("");
            setJenis("");
            setPeserta("");
            setCatatan("");
            setSetuju(false);
            setDokumen(null);
            navigate("/ruang");
          }}>
            Ajukan Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Ajukan Peminjaman"
        description={`Langkah ${step} dari 4`}
        action={
          <Button variant="ghost" onClick={() => navigate("/ruang")}>
            Batal
          </Button>
        }
      />

      {/* Stepper */}
      <div className="roomie-stepper mb-8">
        {[
          { n: 1, label: "Ruang & Waktu" },
          { n: 2, label: "Data Kegiatan" },
          { n: 3, label: "Fasilitas & Dokumen" },
          { n: 4, label: "Tinjau & Kirim" },
        ].map((s) => (
          <div
            key={s.n}
            className={`step ${step > s.n ? "done" : step === s.n ? "active" : ""}`}
          >
            <div className="ring">
              {step > s.n ? <Check className="h-4 w-4" /> : s.n}
            </div>
            <span className="label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <Label>Ruang</Label>
            <Select
              value={ruang ? String(ruang.id) : ""}
              onValueChange={(v) => {
                const r = ruangList.find((x) => String(x.id) === v);
                setRuang(r || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih ruang" />
              </SelectTrigger>
              <SelectContent>
                {ruangList.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.nama} ({r.kode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tanggal">Tanggal Penggunaan</Label>
            <Input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
            {ketersediaan?.minimalTanggal && (
              <p className="text-xs text-muted-foreground">
                Pengajuan paling cepat untuk tanggal{" "}
                <strong>{formatTanggalPendek(ketersediaan.minimalTanggal)}</strong>
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mulai">Jam Mulai</Label>
              <Input
                id="mulai"
                type="time"
                step="900"
                value={jamMulai}
                onChange={(e) => setJamMulai(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="selesai">Jam Selesai</Label>
              <Input
                id="selesai"
                type="time"
                step="900"
                value={jamSelesai}
                onChange={(e) => setJamSelesai(e.target.value)}
              />
            </div>
          </div>

          {/* Pesan ketersediaan */}
          {ketLoading && <p className="text-sm text-muted-foreground">Memeriksa ketersediaan...</p>}
          {ketersediaan && !ketLoading && (
            <div className="space-y-2">
              {ketersediaan.bentrok && (
                <InfoNote tone="danger">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p>
                        Bentrok dengan &ldquo;{ketersediaan.bentrok.judul}&rdquo; pukul{" "}
                        {ketersediaan.bentrok.mulai}–{ketersediaan.bentrok.selesai}.
                      </p>
                      {ketersediaan.saran.length > 0 && (
                        <p className="mt-1">
                          Coba jam{" "}
                          {ketersediaan.saran
                            .map((s) => `${s.mulai}–${s.selesai}`)
                            .join(", ")}
                          .
                        </p>
                      )}
                    </div>
                  </div>
                </InfoNote>
              )}
              {!ketersediaan.bentrok && ketersediaan.jamValid && (
                <InfoNote tone={ketersediaan.diLuarJamKerja ? "warn" : "success"}>
                  {ketersediaan.diLuarJamKerja ? (
                    <span className="flex gap-2">
                      <Moon className="h-4 w-4 shrink-0 mt-0.5" />
                      Di luar jam kerja. Pengajuan akan diteruskan ke GA dengan
                      penanda khusus.
                    </span>
                  ) : (
                    <span className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      Ruang tersedia pada jam tersebut.
                    </span>
                  )}
                </InfoNote>
              )}
              {ketersediaan.jamError && (
                <InfoNote tone="danger">{ketersediaan.jamError}</InfoNote>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={() => setStep(2)} disabled={!step1Valid}>
              Lanjut <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <Label htmlFor="judul">Judul Kegiatan</Label>
            <Input
              id="judul"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Mis. Rapat DPM Bulanan"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Jenis Kegiatan</Label>
              <Select value={jenis} onValueChange={setJenis}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {meta.jenisKegiatan.map((j) => (
                    <SelectItem key={j.value} value={j.value}>
                      {j.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="peserta">Jumlah Peserta</Label>
              <Input
                id="peserta"
                type="number"
                min={1}
                value={peserta}
                onChange={(e) =>
                  setPeserta(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                }
              />
              {ruang?.kapasitas > 0 && peserta && peserta > ruang.kapasitas && (
                <p className="text-xs text-destructive">
                  Melebihi kapasitas ruang ({ruang.kapasitas} orang).
                </p>
              )}
              {ruang?.kapasitas > 0 && peserta && peserta <= ruang.kapasitas && (
                <p className="text-xs text-muted-foreground">
                  Kapasitas ruang {ruang.kapasitas} orang.
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pj">Penanggung Jawab Kegiatan</Label>
            <Input id="pj" value={pj} onChange={(e) => setPj(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Sifat Penggunaan</Label>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 px-3 h-10 rounded-lg border border-primary bg-accent text-accent-foreground text-sm font-medium"
              >
                Sekali Pakai
              </button>
              <button
                type="button"
                disabled
                className="flex-1 px-3 h-10 rounded-lg border border-border bg-muted text-muted-foreground text-sm font-medium opacity-60 cursor-not-allowed"
                title="Segera hadir di versi berikutnya"
              >
                Berkala (segera hadir)
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="catatan">Catatan Tambahan (opsional)</Label>
            <Textarea
              id="catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
            />
          </div>
          {/* Data pemohon hanya-baca */}
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Data Pemohon
            </p>
            <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div className="flex justify-between sm:block">
                <dt className="text-muted-foreground">Nama</dt>
                <dd>{user?.nama}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-muted-foreground">NIM/NIP</dt>
                <dd>{user?.nimNip}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-muted-foreground">Unit</dt>
                <dd>{user?.unitNama || "-"}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-muted-foreground">No. HP</dt>
                <dd>{user?.noHp || "-"}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate">{user?.email}</dd>
              </div>
            </dl>
            <button
              onClick={() => navigate("/profil")}
              className="text-xs text-primary hover:underline mt-2"
            >
              Perbarui profil
            </button>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={
                judul.trim().length < 3 || !jenis || !peserta || pj.trim().length < 2
              }
            >
              Lanjut <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-4 max-w-xl">
          {ruang && ruang.fasilitas.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ruang ini tidak mencantumkan fasilitas tambahan.
            </p>
          )}
          {ruang?.fasilitas.map((f: any) => {
            const st = fasilitas[f.facilityId] || {
              jumlah: 1,
              keterangan: "",
              dipakai: false,
            };
            return (
              <label
                key={f.facilityId}
                className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card cursor-pointer hover:border-primary/50"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--primary)]"
                  checked={st.dipakai}
                  onChange={(e) =>
                    setFasilitas((prev) => ({
                      ...prev,
                      [f.facilityId]: { ...st, dipakai: e.target.checked },
                    }))
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{f.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    Tersedia {f.jumlah} {f.satuan}
                  </p>
                  {st.dipakai && (
                    <div className="mt-2 flex gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={f.jumlah}
                        value={st.jumlah}
                        onChange={(e) =>
                          setFasilitas((prev) => ({
                            ...prev,
                            [f.facilityId]: {
                              ...st,
                              jumlah: Math.min(
                                parseInt(e.target.value || "1", 10),
                                f.jumlah,
                              ),
                            },
                          }))
                        }
                        className="w-20 h-9"
                      />
                      <Input
                        value={st.keterangan}
                        onChange={(e) =>
                          setFasilitas((prev) => ({
                            ...prev,
                            [f.facilityId]: { ...st, keterangan: e.target.value },
                          }))
                        }
                        placeholder="Keterangan (opsional)"
                        className="flex-1 h-9"
                      />
                    </div>
                  )}
                </div>
              </label>
            );
          })}

          {/* Unggah dokumen */}
          <div className="space-y-1.5">
            <Label>Dokumen Pendukung (opsional)</Label>
            <p className="text-xs text-muted-foreground -mt-0.5">
              Lampirkan surat izin tertulis jika ada, terutama untuk pengajuan di
              luar jam kerja. Maks 2 MB (PDF/JPG/PNG).
            </p>
            <input
              ref={undefined}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(e) => setDokumen(e.target.files?.[0] || null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-accent-foreground file:font-medium hover:file:bg-accent/80 cursor-pointer"
            />
            {dokumen && (
              <div className="flex items-center gap-2 text-sm mt-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="truncate flex-1">{dokumen.name}</span>
                <button
                  onClick={() => setDokumen(null)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali
            </Button>
            <Button onClick={() => setStep(4)}>
              Tinjau <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div className="space-y-4 max-w-2xl">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Section title="Ruang & Waktu" onEdit={() => setStep(1)}>
              <Row k="Ruang" v={`${ruang?.nama} (${ruang?.kode})`} />
              <Row k="Tanggal" v={formatTanggalPendek(tanggal)} />
              <Row k="Jam" v={`${jamMulai} – ${jamSelesai}`} />
              {ketersediaan?.diLuarJamKerja && (
                <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                  <Moon className="h-3 w-3" /> Di luar jam kerja
                </p>
              )}
            </Section>
            <Section title="Data Kegiatan" onEdit={() => setStep(2)}>
              <Row k="Judul" v={judul} />
              <Row
                k="Jenis"
                v={meta.jenisKegiatan.find((j) => j.value === jenis)?.label || jenis}
              />
              <Row k="Peserta" v={`${peserta} orang`} />
              <Row k="Penanggung Jawab" v={pj} />
              {catatan && <Row k="Catatan" v={catatan} />}
            </Section>
            <Section title="Fasilitas" onEdit={() => setStep(3)}>
              {Object.entries(fasilitas).filter(([, v]) => v.dipakai).length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada fasilitas dipilih.</p>
              ) : (
                <ul className="text-sm space-y-1">
                  {Object.entries(fasilitas)
                    .filter(([, v]) => v.dipakai)
                    .map(([fid, v]) => {
                      const f = ruang?.fasilitas.find((x: any) => String(x.facilityId) === fid);
                      return (
                        <li key={fid}>
                          {f?.nama}: {v.jumlah} {f?.satuan}
                          {v.keterangan ? ` — ${v.keterangan}` : ""}
                        </li>
                      );
                    })}
                </ul>
              )}
            </Section>
            <Section title="Dokumen" onEdit={() => setStep(3)}>
              {dokumen ? (
                <p className="text-sm">{dokumen.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada dokumen.</p>
              )}
            </Section>
          </div>

          {/* Ketentuan */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-semibold mb-2">9 Ketentuan Penggunaan Ruang</p>
            <ol className="list-decimal list-inside text-sm space-y-1.5 text-foreground/90">
              {meta.ketentuan.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ol>
            <label className="flex items-start gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                checked={setuju}
                onChange={(e) => setSetuju(e.target.checked)}
              />
              <span className="text-sm">
                Saya telah membaca, memahami, dan menyetujui seluruh ketentuan
                di atas.
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali
            </Button>
            <Button onClick={handleSubmit} disabled={!setuju || submitting}>
              {submitting ? "Memproses..." : "Kirim Pengajuan"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 border-b border-border last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <button
          onClick={onEdit}
          className="text-xs text-primary hover:underline"
        >
          Ubah
        </button>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{k}</span>
      <span className="text-right break-words">{v}</span>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "../api";
import { useMeta } from "../meta";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loading, PageHeader, EmptyState, formatTanggalPendek } from "../ui-bits";
import {
  Building2,
  Package,
  Users,
  CalendarOff,
  Settings2,
  History,
  Plus,
  Pencil,
  Trash2,
  Save,
  ShieldAlert,
} from "lucide-react";

const TABS = [
  { v: "ruang", l: "Ruang", icon: Building2 },
  { v: "fasilitas", l: "Fasilitas", icon: Package },
  { v: "pengguna", l: "Pengguna", icon: Users },
  { v: "libur", l: "Hari Libur", icon: CalendarOff },
  { v: "pengaturan", l: "Pengaturan", icon: Settings2 },
  { v: "audit", l: "Audit Log", icon: History },
];

export function Admin() {
  const [tab, setTab] = useState("ruang");
  return (
    <div>
      <PageHeader title="Admin" description="Kelola ruang, fasilitas, pengguna, dan pengaturan sistem." />
      <div className="flex gap-2 overflow-x-auto roomie-scroll pb-2 mb-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={`px-3 h-9 rounded-lg text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 border transition-colors ${
                tab === t.v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground/80 border-border hover:border-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.l}
            </button>
          );
        })}
      </div>
      {tab === "ruang" && <RuangTab />}
      {tab === "fasilitas" && <FasilitasTab />}
      {tab === "pengguna" && <PenggunaTab />}
      {tab === "libur" && <LiburTab />}
      {tab === "pengaturan" && <PengaturanTab />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}

// ---------- Ruang ----------
type Ruang = {
  id: number; kode: string; nama: string; tipe: string; tipeLabel: string;
  gedung: string | null; lantai: string | null; kapasitas: number;
  deskripsi: string | null; isActive: boolean;
  fasilitas: { facilityId: number; nama: string; satuan: string; jumlah: number }[];
};
function RuangTab() {
  const { meta } = useMeta();
  const [list, setList] = useState<Ruang[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Ruang | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await api<{ ruang: Ruang[] }>("/api/admin/ruang");
      setList(d.ruang);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function tambah() {
    setEdit(null);
    setOpen(true);
  }
  function ubah(r: Ruang) {
    setEdit(r);
    setOpen(true);
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={tambah}><Plus className="h-4 w-4 mr-1.5" /> Tambah Ruang</Button>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={<Building2 className="h-8 w-8" />} title="Belum ada ruang" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto roomie-scroll">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Kode</th>
                <th className="px-3 py-2.5 font-semibold">Nama</th>
                <th className="px-3 py-2.5 font-semibold">Jenis</th>
                <th className="px-3 py-2.5 font-semibold">Lokasi</th>
                <th className="px-3 py-2.5 font-semibold">Kapasitas</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-mono text-xs">{r.kode}</td>
                  <td className="px-3 py-2.5">{r.nama}</td>
                  <td className="px-3 py-2.5">{r.tipeLabel}</td>
                  <td className="px-3 py-2.5">{r.gedung}{r.lantai ? ` · Lt. ${r.lantai}` : ""}</td>
                  <td className="px-3 py-2.5">{r.kapasitas}</td>
                  <td className="px-3 py-2.5">
                    {r.isActive ? (
                      <span className="text-emerald-700 text-xs font-medium">Aktif</span>
                    ) : (
                      <span className="text-muted-foreground text-xs font-medium">Nonaktif</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button variant="ghost" size="sm" onClick={() => ubah(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <RuangForm
          meta={meta}
          ruang={edit}
          onClose={() => setOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function RuangForm({ meta, ruang, onClose, onSaved }: any) {
  const [kode, setKode] = useState(ruang?.kode || "");
  const [nama, setNama] = useState(ruang?.nama || "");
  const [tipe, setTipe] = useState(ruang?.tipe || "ruang_kelas");
  const [gedung, setGedung] = useState(ruang?.gedung || "");
  const [lantai, setLantai] = useState(ruang?.lantai || "");
  const [kapasitas, setKapasitas] = useState(ruang?.kapasitas ?? 0);
  const [deskripsi, setDeskripsi] = useState(ruang?.deskripsi || "");
  const [isActive, setIsActive] = useState(ruang?.isActive ?? true);
  const [fas, setFas] = useState<Record<number, { dipakai: boolean; jumlah: number }>>(
    () => {
      const init: any = {};
      meta.facilities.forEach((f: any) => {
        const existing = ruang?.fasilitas?.find((x: any) => x.facilityId === f.id);
        init[f.id] = {
          dipakai: !!existing,
          jumlah: existing?.jumlah ?? 1,
        };
      });
      return init;
    },
  );
  const [busy, setBusy] = useState(false);

  async function simpan() {
    setBusy(true);
    try {
      const body = {
        kode: kode.toUpperCase(),
        nama,
        tipe,
        gedung: gedung || null,
        lantai: lantai || null,
        kapasitas: Number(kapasitas) || 0,
        deskripsi: deskripsi || null,
        isActive,
        fasilitas: Object.entries(fas)
          .filter(([, v]) => (v as any).dipakai)
          .map(([fid, v]) => ({ facilityId: parseInt(fid, 10), jumlah: (v as any).jumlah })),
      };
      if (ruang) {
        await api(`/api/admin/ruang/${ruang.id}`, { method: "PATCH", body });
        toast.success("Ruang diperbarui.");
      } else {
        await api("/api/admin/ruang", { method: "POST", body });
        toast.success("Ruang ditambahkan.");
      }
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto roomie-scroll">
        <DialogHeader>
          <DialogTitle>{ruang ? "Ubah Ruang" : "Tambah Ruang"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Kode</Label>
              <Input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="R-7.3" />
            </div>
            <div className="space-y-1">
              <Label>Jenis</Label>
              <Select value={tipe} onValueChange={setTipe}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meta.tipeRuang.map((t: any) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Nama</Label>
            <Input value={nama} onChange={(e) => setNama(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Gedung</Label>
              <Input value={gedung} onChange={(e) => setGedung(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Lantai</Label>
              <Input value={lantai} onChange={(e) => setLantai(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Kapasitas</Label>
              <Input type="number" min={0} value={kapasitas} onChange={(e) => setKapasitas(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Deskripsi</Label>
            <Textarea rows={2} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fasilitas</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto roomie-scroll p-1 border border-border rounded-lg">
              {meta.facilities.map((f: any) => {
                const st = fas[f.id];
                return (
                  <label key={f.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--primary)]"
                      checked={st?.dipakai}
                      onChange={(e) =>
                        setFas((prev: any) => ({ ...prev, [f.id]: { ...prev[f.id], dipakai: e.target.checked } }))
                      }
                    />
                    <span className="flex-1 truncate">{f.nama}</span>
                    {st?.dipakai && (
                      <Input
                        type="number"
                        min={1}
                        className="h-7 w-14"
                        value={st.jumlah}
                        onChange={(e) =>
                          setFas((prev: any) => ({ ...prev, [f.id]: { ...prev[f.id], jumlah: Number(e.target.value) || 1 } }))
                        }
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm">Ruang aktif</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={simpan} disabled={busy}>
            <Save className="h-4 w-4 mr-1.5" /> {busy ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Fasilitas ----------
type Fasilitas = { id: number; nama: string; satuan: string };
function FasilitasTab() {
  const [list, setList] = useState<Fasilitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [satuan, setSatuan] = useState("unit");
  const [edit, setEdit] = useState<Fasilitas | null>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await api<{ fasilitas: Fasilitas[] }>("/api/admin/fasilitas");
      setList(d.fasilitas);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    if (nama.trim().length < 2) return;
    try {
      await api("/api/admin/fasilitas", { method: "POST", body: { nama, satuan } });
      setNama("");
      setSatuan("unit");
      toast.success("Fasilitas ditambahkan.");
      load();
    } catch (e: any) {
      toast.error(e.message || "Gagal.");
    }
  }

  async function simpanEdit() {
    if (!edit) return;
    try {
      await api(`/api/admin/fasilitas/${edit.id}`, {
        method: "PATCH",
        body: { nama: edit.nama, satuan: edit.satuan },
      });
      toast.success("Fasilitas diperbarui.");
      setEdit(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Gagal.");
    }
  }

  async function hapus(f: Fasilitas) {
    try {
      await api(`/api/admin/fasilitas/${f.id}`, { method: "DELETE" });
      toast.success("Fasilitas dihapus.");
      load();
    } catch (e: any) {
      toast.error(e.message || "Gagal. Fasilitas mungkin masih dipakai.");
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <form onSubmit={tambah} className="bg-card border border-border rounded-xl p-4 mb-4 flex flex-wrap gap-2 items-end">
        <div className="space-y-1 flex-1 min-w-[180px]">
          <Label className="text-xs">Nama Fasilitas</Label>
          <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Mis. Proyektor" />
        </div>
        <div className="space-y-1 w-28">
          <Label className="text-xs">Satuan</Label>
          <Input value={satuan} onChange={(e) => setSatuan(e.target.value)} />
        </div>
        <Button type="submit"><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
      </form>
      <ul className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
        {list.map((f) => (
          <li key={f.id} className="p-3 flex items-center gap-2">
            {edit?.id === f.id ? (
              <>
                <Input value={edit.nama} onChange={(e) => setEdit({ ...edit, nama: e.target.value })} className="flex-1" />
                <Input value={edit.satuan} onChange={(e) => setEdit({ ...edit, satuan: e.target.value })} className="w-24" />
                <Button size="sm" onClick={simpanEdit}>Simpan</Button>
                <Button size="sm" variant="outline" onClick={() => setEdit(null)}>Batal</Button>
              </>
            ) : (
              <>
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium flex-1">{f.nama}</span>
                <span className="text-sm text-muted-foreground">{f.satuan}</span>
                <Button size="sm" variant="ghost" onClick={() => setEdit({ ...f })}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus fasilitas "{f.nama}"?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                      Fasilitas yang masih dipakai pada ruang atau booking tidak dapat dihapus.
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => hapus(f)}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Pengguna ----------
type Pengguna = {
  id: number; nama: string; nimNip: string; email: string; noHp: string | null;
  jabatan: string | null; roleNama: string; unitNama: string | null; unitId: number | null;
  isActive: boolean;
};
function PenggunaTab() {
  const { meta } = useMeta();
  const [list, setList] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Pengguna | null>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await api<{ pengguna: Pengguna[] }>(`/api/admin/pengguna?q=${encodeURIComponent(q)}`);
      setList(d.pengguna);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [q]);

  if (loading) return <Loading />;

  return (
    <div>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari nama, email, atau NIM/NIP..."
        className="mb-3 max-w-sm"
      />
      <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto roomie-scroll">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Nama</th>
              <th className="px-3 py-2.5 font-semibold">NIM/NIP</th>
              <th className="px-3 py-2.5 font-semibold">Email</th>
              <th className="px-3 py-2.5 font-semibold">Peran</th>
              <th className="px-3 py-2.5 font-semibold">Unit</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-3 py-2.5">{u.nama}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{u.nimNip}</td>
                <td className="px-3 py-2.5 text-xs">{u.email}</td>
                <td className="px-3 py-2.5"><span className="capitalize">{u.roleNama}</span></td>
                <td className="px-3 py-2.5">{u.unitNama || "-"}</td>
                <td className="px-3 py-2.5">
                  {u.isActive ? (
                    <span className="text-emerald-700 text-xs font-medium">Aktif</span>
                  ) : (
                    <span className="text-muted-foreground text-xs font-medium">Nonaktif</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEdit(u)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <PenggunaForm meta={meta} user={edit} onClose={() => setEdit(null)} onSaved={load} />
      )}
    </div>
  );
}

function PenggunaForm({ meta, user, onClose, onSaved }: any) {
  const [roleNama, setRoleNama] = useState(user.roleNama);
  const [unitId, setUnitId] = useState(user.unitId ? String(user.unitId) : "");
  const [isActive, setIsActive] = useState(user.isActive);
  const [passwordBaru, setPasswordBaru] = useState("");
  const [busy, setBusy] = useState(false);

  async function simpan() {
    setBusy(true);
    try {
      const body: any = {
        roleNama,
        unitId: unitId === "" ? null : parseInt(unitId, 10),
        isActive,
      };
      if (passwordBaru) body.passwordBaru = passwordBaru;
      await api(`/api/admin/pengguna/${user.id}`, { method: "PATCH", body });
      toast.success("Pengguna diperbarui.");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Pengguna</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {user.nama} · {user.email}
          </div>
          <div className="space-y-1">
            <Label>Peran</Label>
            <Select value={roleNama} onValueChange={setRoleNama}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["peminjam", "kemahasiswaan", "ga", "satpam", "admin"].map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Unit</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger><SelectValue placeholder="Tanpa unit" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tanpa unit</SelectItem>
                {meta.units.map((u: any) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm">Akun aktif</span>
          </label>
          <div className="space-y-1">
            <Label>Atur Ulang Kata Sandi (opsional)</Label>
            <Input
              type="text"
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              placeholder="Kosongkan jika tidak diubah"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Beri kata sandi sementara minimal 8 karakter.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={simpan} disabled={busy}>
            <Save className="h-4 w-4 mr-1.5" /> {busy ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Hari Libur ----------
type Libur = { tanggal: string; keterangan: string };
function LiburTab() {
  const [list, setList] = useState<Libur[]>([]);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState("");
  const [keterangan, setKeterangan] = useState("");

  async function load() {
    setLoading(true);
    try {
      const d = await api<{ libur: Libur[] }>("/api/admin/libur");
      setList(d.libur);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    if (!tanggal || keterangan.trim().length < 3) return;
    try {
      await api("/api/admin/libur", { method: "POST", body: { tanggal, keterangan } });
      setTanggal("");
      setKeterangan("");
      toast.success("Hari libur ditambahkan.");
      load();
    } catch (e: any) {
      toast.error(e.message || "Gagal.");
    }
  }

  async function hapus(t: string) {
    try {
      await api(`/api/admin/libur/${t}`, { method: "DELETE" });
      toast.success("Hari libur dihapus.");
      load();
    } catch (e: any) {
      toast.error(e.message || "Gagal.");
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <form onSubmit={tambah} className="bg-card border border-border rounded-xl p-4 mb-4 flex flex-wrap gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Tanggal</Label>
          <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </div>
        <div className="space-y-1 flex-1 min-w-[180px]">
          <Label className="text-xs">Keterangan</Label>
          <Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Mis. Hari Raya Natal" />
        </div>
        <Button type="submit"><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
      </form>
      <ul className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
        {list.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">Belum ada hari libur.</li>
        ) : (
          list.map((l) => (
            <li key={l.tanggal} className="p-3 flex items-center gap-2">
              <CalendarOff className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm">{formatTanggalPendek(l.tanggal)}</span>
              <span className="flex-1">{l.keterangan}</span>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => hapus(l.tanggal)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

// ---------- Pengaturan ----------
function PengaturanTab() {
  const [s, setS] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const d = await api<{ pengaturan: any }>("/api/admin/pengaturan");
    setS(d.pengaturan);
  }
  useEffect(() => {
    load();
  }, []);

  async function simpan() {
    setBusy(true);
    try {
      await api("/api/admin/pengaturan", {
        method: "PUT",
        body: {
          jam_kerja_mulai: s.jam_kerja_mulai,
          jam_kerja_selesai: s.jam_kerja_selesai,
          min_hari_kerja_pengajuan: Number(s.min_hari_kerja_pengajuan),
          min_hari_pembatalan: Number(s.min_hari_pembatalan),
          hari_kerja: s.hari_kerja,
        },
      });
      toast.success("Pengaturan disimpan.");
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  if (!s) return <Loading />;

  const hari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minngu"];
  const checked = s.hari_kerja.split(",").map((x: string) => parseInt(x, 10));

  function toggleHari(i: number) {
    const set = new Set(checked);
    if (set.has(i)) set.delete(i);
    else set.add(i);
    setS({ ...s, hari_kerja: [...set].sort().join(",") });
  }

  return (
    <div className="max-w-lg bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Jam Kerja Mulai</Label>
          <Input type="time" value={s.jam_kerja_mulai} onChange={(e) => setS({ ...s, jam_kerja_mulai: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Jam Kerja Selesai</Label>
          <Input type="time" value={s.jam_kerja_selesai} onChange={(e) => setS({ ...s, jam_kerja_selesai: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Min. Hari Kerja Pengajuan</Label>
          <Input type="number" min={0} value={s.min_hari_kerja_pengajuan} onChange={(e) => setS({ ...s, min_hari_kerja_pengajuan: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Min. Hari Pembatalan</Label>
          <Input type="number" min={0} value={s.min_hari_pembatalan} onChange={(e) => setS({ ...s, min_hari_pembatalan: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Hari Kerja</Label>
        <div className="flex flex-wrap gap-2">
          {hari.map((h, i) => (
            <label key={h} className={`px-3 h-9 rounded-lg border text-sm font-medium cursor-pointer inline-flex items-center gap-1.5 ${
              checked.includes(i + 1)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border"
            }`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={checked.includes(i + 1)}
                onChange={() => toggleHari(i + 1)}
              />
              {h}
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={simpan} disabled={busy}>
          <Save className="h-4 w-4 mr-1.5" /> {busy ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </div>
    </div>
  );
}

// ---------- Audit Log ----------
function AuditTab() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aksi, setAksi] = useState("");

  async function load() {
    setLoading(true);
    try {
      const d = await api<{ audit: any[] }>(`/api/admin/audit?aksi=${encodeURIComponent(aksi)}`);
      setList(d.audit);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [aksi]);

  if (loading) return <Loading />;

  return (
    <div>
      <Input
        value={aksi}
        onChange={(e) => setAksi(e.target.value)}
        placeholder="Filter aksi (mis. ubah_status, check_in)..."
        className="mb-3 max-w-sm"
      />
      <ul className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden max-h-[600px] overflow-y-auto roomie-scroll">
        {list.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">Tidak ada catatan audit.</li>
        ) : (
          list.map((a) => (
            <li key={a.id} className="p-3 flex items-start gap-2 text-sm">
              <History className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p>
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{a.aksi}</span>{" "}
                  pada <span className="font-medium">{a.tabel}</span>
                  {a.recordId ? ` #${a.recordId}` : ""}
                </p>
                {a.detail && <p className="text-muted-foreground text-xs mt-0.5">{a.detail}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {a.user ? `${a.user} · ` : ""}
                  {a.createdAt}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "../auth";
import { useRoute, navigate } from "../router";
import { api } from "../api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Building2 } from "lucide-react";
import { useMeta } from "../meta";

const DEMO = [
  { email: "mahasiswa@roomie.test", label: "Peminjam (Mahasiswa)", nama: "Rani Putri", role: "Mode HP / Mahasiswa" },
  { email: "kemahasiswaan@roomie.test", label: "Kemahasiswaan", nama: "Bu Sari", role: "Operator Tahap 1" },
  { email: "ga@roomie.test", label: "Sarpras & GA", nama: "Pak Budi", role: "Operator Tahap 2" },
  { email: "satpam@roomie.test", label: "Satpam", nama: "Pak Dimas", role: "Petugas Lapangan" },
  { email: "admin@roomie.test", label: "Administrator", nama: "Admin ROOMIE", role: "Full Desktop Control" },
];

export function Masuk() {
  const route = useRoute();
  const startTab = route.segments[0] === "daftar" ? "daftar" : "masuk";
  const [tab, setTab] = useState<"masuk" | "daftar">(startTab);
  const { login, register, fetchUser } = useAuth();
  const { meta } = useMeta();

  // login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  // daftar state
  const [dNama, setDNama] = useState("");
  const [dNim, setDNim] = useState("");
  const [dEmail, setDEmail] = useState("");
  const [dHp, setDHp] = useState("");
  const [dUnit, setDUnit] = useState("");
  const [dPw, setDPw] = useState("");
  const [dPw2, setDPw2] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success(`Selamat datang, ${u.nama.split(" ")[0]}!`);
      navigate(u.roleNama === "satpam" ? "/satpam" : "/beranda");
    } catch (e: any) {
      toast.error(e.message || "Email atau kata sandi salah.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDaftar(e: React.FormEvent) {
    e.preventDefault();
    const f: Record<string, string> = {};
    if (dNama.trim().length < 2) f.nama = "Nama lengkap minimal 2 karakter.";
    if (!/^\S+@\S+\.\S+$/.test(dEmail)) f.email = "Format email tidak valid.";
    if (dNim.trim().length < 3) f.nimNip = "NIM/NIP minimal 3 karakter.";
    if (dPw.length < 8) f.password = "Kata sandi minimal 8 karakter.";
    if (dPw !== dPw2) f.konfirmasi = "Konfirmasi tidak cocok.";
    setErr(f);
    if (Object.keys(f).length > 0) return;
    setBusy(true);
    try {
      const u = await register({
        nama: dNama,
        nimNip: dNim,
        email: dEmail,
        noHp: dHp,
        unitId: dUnit,
        password: dPw,
        konfirmasiPassword: dPw2,
      });
      toast.success(`Selamat datang, ${u.nama.split(" ")[0]}!`);
      navigate("/beranda");
    } catch (e: any) {
      if (e.fields) setErr(e.fields);
      else toast.error(e.message || "Pendaftaran gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function demoLogin(em: string, e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (busy) return;
    setEmail(em);
    setPassword("Roomie123!");
    setBusy(true);
    try {
      const u = await login(em, "Roomie123!");
      toast.success(`Masuk sebagai ${u.nama.split(" ")[0]}.`);
      navigate(u.roleNama === "satpam" ? "/satpam" : "/beranda");
    } catch (e: any) {
      toast.error(e.message || "Gagal masuk.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-stretch sm:items-center justify-center bg-background px-4 py-10 sm:py-16">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Branding kiri */}
        <div className="hidden lg:block px-4">
          <div className="flex items-center gap-3.5 mb-6">
            <img
              src="/logo.png"
              alt="ROOMIE Logo"
              className="h-16 w-auto object-contain drop-shadow-md"
            />
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                ROOMIE
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Kampus
                </span>
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Sistem Peminjaman Ruangan & Fasilitas
              </p>
            </div>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-foreground">
            Ajukan peminjaman ruang kampus dalam{" "}
            <span className="text-primary underline decoration-teal-400 decoration-wavy decoration-2">4 langkah mudah</span>, serba digital.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-md text-sm leading-relaxed">
            ROOMIE mengganti formulir kertas CWE-FORM: kalender terpadu,
            persetujuan berjenjang, verifikasi check-in Satpam, dan laporan otomatis.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-foreground/85">
            <li className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-teal-600 ring-2 ring-teal-200" />
              Bebas bentrok jadwal & anti double-booking
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-teal-600 ring-2 ring-teal-200" />
              Status pengajuan real-time lewat ponsel
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-teal-600 ring-2 ring-teal-200" />
              Bukti digital resmi dengan QR Code Satpam
            </li>
          </ul>
        </div>

        {/* Kartu kanan */}
        <div className="bg-card border border-border/80 rounded-2xl shadow-md p-6 sm:p-8 w-full max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <img
              src="/logo.png"
              alt="ROOMIE Logo"
              className="h-12 w-auto object-contain drop-shadow-xs"
            />
            <div>
              <p className="text-xl font-bold tracking-tight text-foreground">ROOMIE</p>
              <p className="text-xs text-muted-foreground">
                Peminjaman Ruang & Lapangan Kampus
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl mb-6">
            <button
              onClick={() => setTab("masuk")}
              className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                tab === "masuk"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setTab("daftar")}
              className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                tab === "daftar"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Daftar
            </button>
          </div>

          {tab === "masuk" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@roomie.test"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Kata Sandi</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPw ? "Sembunyikan" : "Tampilkan"}
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full h-11 text-base"
              >
                {busy ? "Memproses..." : "Masuk"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setTab("daftar")}
                  className="text-primary font-medium hover:underline"
                >
                  Daftar
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleDaftar} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="dNama">Nama Lengkap</Label>
                <Input
                  id="dNama"
                  value={dNama}
                  onChange={(e) => setDNama(e.target.value)}
                  required
                />
                {err.nama && (
                  <p className="text-xs text-destructive">{err.nama}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dNim">NIM / NIP</Label>
                  <Input
                    id="dNim"
                    value={dNim}
                    onChange={(e) => setDNim(e.target.value)}
                    required
                  />
                  {err.nimNip && (
                    <p className="text-xs text-destructive">{err.nimNip}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dHp">No. HP</Label>
                  <Input
                    id="dHp"
                    value={dHp}
                    onChange={(e) => setDHp(e.target.value)}
                    placeholder="0812-..."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dEmail">Email</Label>
                <Input
                  id="dEmail"
                  type="email"
                  value={dEmail}
                  onChange={(e) => setDEmail(e.target.value)}
                  required
                />
                {err.email && (
                  <p className="text-xs text-destructive">{err.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dUnit">Unit</Label>
                <Select value={dUnit} onValueChange={setDUnit}>
                  <SelectTrigger id="dUnit" className="w-full">
                    <SelectValue placeholder="Pilih unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.units.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        <span className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 opacity-60" />
                          {u.nama}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dPw">Kata Sandi</Label>
                  <Input
                    id="dPw"
                    type="password"
                    value={dPw}
                    onChange={(e) => setDPw(e.target.value)}
                    required
                  />
                  {err.password && (
                    <p className="text-xs text-destructive">{err.password}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dPw2">Ulangi Sandi</Label>
                  <Input
                    id="dPw2"
                    type="password"
                    value={dPw2}
                    onChange={(e) => setDPw2(e.target.value)}
                    required
                  />
                  {err.konfirmasi && (
                    <p className="text-xs text-destructive">{err.konfirmasi}</p>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full h-11 text-base"
              >
                {busy ? "Memproses..." : "Daftar & Masuk"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setTab("masuk")}
                  className="text-primary font-medium hover:underline"
                >
                  Masuk
                </button>
              </p>
            </form>
          )}

          {/* Panel akun demo */}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Coba dengan akun demo
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={(e) => demoLogin(d.email, e)}
                  disabled={busy}
                  className="text-left p-2.5 rounded-xl border border-border/80 hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-all duration-150 disabled:opacity-50 group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="block text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {d.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
                      demo
                    </span>
                  </div>
                  <span className="block text-[11px] text-muted-foreground truncate mt-0.5">
                    {d.nama} · <span className="text-teal-700 dark:text-teal-400 font-medium">{d.role}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Kata sandi semua akun demo: <code className="font-mono">Roomie123!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

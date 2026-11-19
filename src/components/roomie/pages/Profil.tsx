"use client";

import { useState } from "react";
import { useAuth } from "../auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "../ui-bits";
import { User, KeyRound } from "lucide-react";

export function Profil() {
  const { user, updateProfile } = useAuth();
  const [nama, setNama] = useState(user?.nama || "");
  const [noHp, setNoHp] = useState(user?.noHp || "");
  const [jabatan, setJabatan] = useState(user?.jabatan || "");
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [busy, setBusy] = useState(false);

  async function simpanProfil(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ nama, noHp, jabatan });
      toast.success("Profil diperbarui.");
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function gantiSandi(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ passwordLama: lama, passwordBaru: baru });
      toast.success("Kata sandi diubah.");
      setLama("");
      setBaru("");
    } catch (e: any) {
      toast.error(e.message || "Gagal mengubah kata sandi.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Profil" description="Kelola data dan keamanan akun Anda." />

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-muted-foreground" /> Data Diri
          </h2>
          <form onSubmit={simpanProfil} className="space-y-3">
            <div className="space-y-1">
              <Label>Nama</Label>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>NIM/NIP</Label>
              <Input value={user.nimNip} disabled />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-1">
              <Label>No. HP</Label>
              <Input value={noHp} onChange={(e) => setNoHp(e.target.value)} placeholder="0812-..." />
            </div>
            <div className="space-y-1">
              <Label>Jabatan</Label>
              <Input value={jabatan} onChange={(e) => setJabatan(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </form>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <KeyRound className="h-4 w-4 text-muted-foreground" /> Ubah Kata Sandi
          </h2>
          <form onSubmit={gantiSandi} className="space-y-3">
            <div className="space-y-1">
              <Label>Kata Sandi Lama</Label>
              <Input type="password" value={lama} onChange={(e) => setLama(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Kata Sandi Baru</Label>
              <Input type="password" value={baru} onChange={(e) => setBaru(e.target.value)} required />
              <p className="text-xs text-muted-foreground">
                Minimal 8 karakter, memuat huruf dan angka.
              </p>
            </div>
            <Button type="submit" disabled={busy} variant="outline" className="w-full">
              {busy ? "Memproses..." : "Ubah Kata Sandi"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

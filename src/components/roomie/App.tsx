"use client";

import { useEffect } from "react";
import { useAuth } from "./auth";
import { MetaProvider } from "./meta";
import { Nav } from "./nav";
import { useRoute, navigate } from "./router";
import { Loading } from "./ui-bits";
import { Masuk } from "./pages/Masuk";
import { Beranda } from "./pages/Beranda";
import { Ruang } from "./pages/Ruang";
import { Kalender } from "./pages/Kalender";
import { Ajukan } from "./pages/Ajukan";
import { PengajuanSaya } from "./pages/PengajuanSaya";
import { DetailPengajuan } from "./pages/DetailPengajuan";
import { Persetujuan } from "./pages/Persetujuan";
import { Satpam } from "./pages/Satpam";
import { Notifikasi } from "./pages/Notifikasi";
import { Laporan } from "./pages/Laporan";
import { Admin } from "./pages/Admin";
import { CetakBukti } from "./pages/CetakBukti";
import { Profil } from "./pages/Profil";

const ROLE_HOME: Record<string, string> = {
  peminjam: "/beranda",
  kemahasiswaan: "/beranda",
  ga: "/beranda",
  satpam: "/satpam",
  admin: "/beranda",
};

function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center h-6 w-6 rounded bg-primary text-primary-foreground font-bold text-[10px]">
            R
          </span>
          <span>
            <strong className="text-foreground/80">ROOMIE</strong> — Sistem
            Manajemen Peminjaman Ruang & Lapangan Kampus
          </span>
        </div>
        <span>
          Politeknik Kelapa Sawit Citra Widya Edukasi · Kelompok 3 · 2026
        </span>
      </div>
    </footer>
  );
}

function Protected({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.roleNama)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-xl font-bold">Anda tidak memiliki akses ke halaman ini.</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Halaman ini hanya untuk peran: {roles.join(", ")}
        </p>
        <button
          onClick={() => navigate(ROLE_HOME[user?.roleNama ?? "peminjam"] ?? "/beranda")}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-10 px-4 text-sm font-medium"
        >
          Kembali ke beranda
        </button>
      </div>
    );
  }
  return <>{children}</>;
}

function RoutedPage() {
  const route = useRoute();
  const { user } = useAuth();
  const seg = route.segments;

  if (!user) return <Masuk />;
  if (seg.length === 0) {
    navigate(ROLE_HOME[user.roleNama] ?? "/beranda");
    return <Loading />;
  }

  switch (seg[0]) {
    case "masuk":
    case "daftar":
      navigate(ROLE_HOME[user.roleNama] ?? "/beranda");
      return <Loading />;
    case "beranda":
      return <Beranda />;
    case "ruang":
      return (
        <Protected roles={["peminjam", "admin"]}>
          <Ruang />
        </Protected>
      );
    case "kalender":
      return <Kalender />;
    case "ajukan":
      return (
        <Protected roles={["peminjam"]}>
          <Ajukan />
        </Protected>
      );
    case "pengajuan":
      if (seg[1]) return <DetailPengajuan id={seg[1]} />;
      return (
        <Protected roles={["peminjam"]}>
          <PengajuanSaya />
        </Protected>
      );
    case "persetujuan":
      return (
        <Protected roles={["kemahasiswaan", "ga"]}>
          <Persetujuan />
        </Protected>
      );
    case "satpam":
      return (
        <Protected roles={["satpam", "admin"]}>
          <Satpam />
        </Protected>
      );
    case "notifikasi":
      return <Notifikasi />;
    case "laporan":
      return (
        <Protected roles={["kemahasiswaan", "ga", "admin"]}>
          <Laporan />
        </Protected>
      );
    case "admin":
      return (
        <Protected roles={["admin"]}>
          <Admin />
        </Protected>
      );
    case "cetak":
      if (seg[1]) return <CetakBukti id={seg[1]} />;
      return <Loading />;
    case "profil":
      return <Profil />;
    default:
      navigate(ROLE_HOME[user.roleNama] ?? "/beranda");
      return <Loading />;
  }
}

export function App() {
  const { user, fetchUser, fetched } = useAuth();

  useEffect(() => {
    if (!fetched) fetchUser();
  }, [fetchUser, fetched]);

  let content: React.ReactNode;
  if (!fetched) {
    content = (
      <div className="min-h-screen grid place-items-center">
        <Loading label="Memuat ROOMIE..." />
      </div>
    );
  } else if (!user) {
    content = (
      <div className="min-h-screen flex flex-col">
        <Masuk />
        <Footer />
      </div>
    );
  } else {
    content = (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 w-full">
          <div className="mx-auto max-w-6xl px-3 sm:px-4 py-6">
            <RoutedPage />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <MetaProvider>{content}</MetaProvider>;
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth";
import { useRoute, navigate } from "./router";
import { api } from "./api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  LogOut,
  Menu,
  User as UserIcon,
  Building2,
  CalendarDays,
  Home,
  ClipboardList,
  ShieldCheck,
  BarChart3,
  Settings2,
  CalendarPlus,
} from "lucide-react";

const MENU: Record<string, { label: string; to: string; icon: any }[]> = {
  peminjam: [
    { label: "Beranda", to: "/beranda", icon: Home },
    { label: "Ruang & Lapangan", to: "/ruang", icon: Building2 },
    { label: "Kalender", to: "/kalender", icon: CalendarDays },
    { label: "Pengajuan Saya", to: "/pengajuan", icon: ClipboardList },
  ],
  kemahasiswaan: [
    { label: "Beranda", to: "/beranda", icon: Home },
    { label: "Persetujuan", to: "/persetujuan", icon: ShieldCheck },
    { label: "Kalender", to: "/kalender", icon: CalendarDays },
    { label: "Laporan", to: "/laporan", icon: BarChart3 },
  ],
  ga: [
    { label: "Beranda", to: "/beranda", icon: Home },
    { label: "Persetujuan", to: "/persetujuan", icon: ShieldCheck },
    { label: "Kalender", to: "/kalender", icon: CalendarDays },
    { label: "Laporan", to: "/laporan", icon: BarChart3 },
  ],
  satpam: [
    { label: "Hari Ini & Scan", to: "/satpam", icon: ShieldCheck },
    { label: "Kalender", to: "/kalender", icon: CalendarDays },
  ],
  admin: [
    { label: "Beranda", to: "/beranda", icon: Home },
    { label: "Ruang & Fasilitas", to: "/admin", icon: Building2 },
    { label: "Kalender", to: "/kalender", icon: CalendarDays },
    { label: "Laporan", to: "/laporan", icon: BarChart3 },
    { label: "Pengaturan Sistem", to: "/admin", icon: Settings2 },
  ],
};

const BOTTOM_NAV: Record<string, { label: string; to: string; icon: any; highlight?: boolean }[]> = {
  peminjam: [
    { label: "Beranda", to: "/beranda", icon: Home },
    { label: "Ruang", to: "/ruang", icon: Building2 },
    { label: "Ajukan", to: "/ruang", icon: CalendarPlus, highlight: true },
    { label: "Pengajuan", to: "/pengajuan", icon: ClipboardList },
    { label: "Profil", to: "/profil", icon: UserIcon },
  ],
  kemahasiswaan: [
    { label: "Beranda", to: "/beranda", icon: Home },
    { label: "Persetujuan", to: "/persetujuan", icon: ShieldCheck, highlight: true },
    { label: "Kalender", to: "/kalender", icon: CalendarDays },
    { label: "Laporan", to: "/laporan", icon: BarChart3 },
    { label: "Profil", to: "/profil", icon: UserIcon },
  ],
  ga: [
    { label: "Beranda", to: "/beranda", icon: Home },
    { label: "Persetujuan", to: "/persetujuan", icon: ShieldCheck, highlight: true },
    { label: "Kalender", to: "/kalender", icon: CalendarDays },
    { label: "Laporan", to: "/laporan", icon: BarChart3 },
    { label: "Profil", to: "/profil", icon: UserIcon },
  ],
  satpam: [
    { label: "Hari Ini", to: "/satpam", icon: ShieldCheck, highlight: true },
    { label: "Kalender", to: "/kalender", icon: CalendarDays },
    { label: "Notifikasi", to: "/notifikasi", icon: Bell },
    { label: "Profil", to: "/profil", icon: UserIcon },
  ],
  admin: [
    { label: "Beranda", to: "/beranda", icon: Home },
    { label: "Kalender", to: "/kalender", icon: CalendarDays },
    { label: "Laporan", to: "/laporan", icon: BarChart3 },
    { label: "Admin", to: "/admin", icon: Settings2, highlight: true },
    { label: "Profil", to: "/profil", icon: UserIcon },
  ],
};

const ROLE_LABELS: Record<string, { label: string; bg: string }> = {
  peminjam: { label: "Mahasiswa / Peminjam", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  kemahasiswaan: { label: "Kemahasiswaan", bg: "bg-blue-50 text-blue-800 border-blue-200" },
  ga: { label: "Umum & Sarpras (GA)", bg: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  satpam: { label: "Keamanan (Satpam)", bg: "bg-amber-50 text-amber-800 border-amber-200" },
  admin: { label: "Administrator", bg: "bg-purple-50 text-purple-800 border-purple-200" },
};

export function Nav() {
  const { user, logout, setUnread } = useAuth();
  const route = useRoute();
  const [open, setOpen] = useState(false);

  // muat ulang jumlah belum dibaca tiap 30 detik
  useEffect(() => {
    if (!user) return;
    let active = true;
    const tick = async () => {
      try {
        const d = await api<{ unread: number }>("/api/notifikasi");
        if (active && typeof d.unread === "number") setUnread(d.unread);
      } catch {}
    };
    const t = setInterval(tick, 30000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [user, setUnread]);

  if (!user) return null;
  const items = MENU[user.roleNama] ?? [];
  const bottomItems = BOTTOM_NAV[user.roleNama] ?? BOTTOM_NAV.peminjam;
  const roleBadge = ROLE_LABELS[user.roleNama] ?? { label: user.roleNama, bg: "bg-muted text-muted-foreground" };

  const isActive = (to: string) => {
    if (to === "/beranda") return route.path === "/beranda" || route.path === "/";
    return route.path === to || route.path.startsWith(to + "/");
  };

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          {/* Brand Logo & Title */}
          <button
            onClick={() => navigate("/beranda")}
            className="flex items-center gap-2.5 shrink-0 text-left hover:opacity-90 transition-opacity"
            aria-label="ROOMIE beranda"
          >
            <img
              src="/logo.png"
              alt="ROOMIE Logo"
              className="h-10 w-auto object-contain drop-shadow-xs"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-foreground leading-none flex items-center gap-1.5">
                ROOMIE
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border tracking-wider bg-teal-50 text-teal-800 border-teal-200">
                  CWE
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground hidden sm:block font-medium">
                Peminjaman Ruang Kampus
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 ml-6">
            {items.map((it) => {
              const Icon = it.icon;
              const active = isActive(it.to);
              return (
                <button
                  key={it.to + it.label}
                  onClick={() => go(it.to)}
                  className={`px-3.5 h-9 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-all duration-150 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-foreground/75 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {it.label}
                </button>
              );
            })}
          </nav>

          {/* User Controls & Quick Badges */}
          <div className="ml-auto flex items-center gap-2">
            {/* Role indicator pill for desktop */}
            <span className={`hidden lg:inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${roleBadge.bg}`}>
              {roleBadge.label}
            </span>

            {/* Notification Bell */}
            <button
              onClick={() => navigate("/notifikasi")}
              className="relative h-10 w-10 grid place-items-center rounded-lg hover:bg-muted text-foreground/80 transition-colors"
              aria-label="Notifikasi"
            >
              <Bell className="h-5 w-5" />
              {user.unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-xs animate-pulse">
                  {user.unread > 99 ? "99+" : user.unread}
                </span>
              )}
            </button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-10 pl-2 pr-3 rounded-lg hover:bg-muted border border-border/60 inline-flex items-center gap-2.5 text-sm transition-colors">
                  <span className="grid place-items-center h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {user.nama.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="max-w-[120px] truncate font-semibold text-xs text-foreground leading-tight">
                      {user.nama}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate leading-tight">
                      {user.roleNama}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5 py-1">
                    <span className="font-bold text-sm truncate">{user.nama}</span>
                    <span className="text-xs text-muted-foreground font-normal truncate">
                      {user.email}
                    </span>
                    <span className="text-[11px] font-semibold text-primary mt-1">
                      {user.unitNama || user.roleNama.toUpperCase()}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profil")} className="cursor-pointer">
                  <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" /> Profil Pengguna
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    toast.success("Anda telah keluar.");
                    navigate("/masuk");
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Drawer Trigger (More Options) */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden h-10 w-10 grid place-items-center rounded-lg hover:bg-muted border border-border/50"
                  aria-label="Menu Lengkap"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 flex flex-col">
                <SheetTitle className="sr-only">Navigasi Utama</SheetTitle>
                <div className="h-16 px-4 flex items-center gap-3 border-b">
                  <img src="/logo.png" alt="ROOMIE Logo" className="h-9 w-auto object-contain" />
                  <div>
                    <span className="font-bold tracking-tight text-base block">ROOMIE</span>
                    <span className="text-[11px] text-muted-foreground block">{roleBadge.label}</span>
                  </div>
                </div>
                <div className="p-3 border-b bg-muted/40">
                  <p className="text-xs font-semibold text-foreground truncate">{user.nama}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <nav className="p-3 flex flex-col gap-1 flex-1 overflow-y-auto">
                  {items.map((it) => {
                    const Icon = it.icon;
                    const active = isActive(it.to);
                    return (
                      <button
                        key={it.to + it.label}
                        onClick={() => go(it.to)}
                        className={`px-3.5 h-11 rounded-lg text-sm font-medium inline-flex items-center gap-3 transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-foreground/80 hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {it.label}
                      </button>
                    );
                  })}
                  <div className="my-2 border-t border-border" />
                  <button
                    onClick={() => go("/profil")}
                    className="px-3.5 h-11 rounded-lg text-sm font-medium inline-flex items-center gap-3 text-foreground/80 hover:bg-muted"
                  >
                    <UserIcon className="h-4 w-4" /> Profil Saya
                  </button>
                  <button
                    onClick={() => go("/notifikasi")}
                    className="px-3.5 h-11 rounded-lg text-sm font-medium inline-flex items-center gap-3 text-foreground/80 hover:bg-muted"
                  >
                    <Bell className="h-4 w-4" /> Notifikasi
                    {user.unread > 0 && (
                      <span className="ml-auto min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                        {user.unread}
                      </span>
                    )}
                  </button>
                </nav>
                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      setOpen(false);
                      await logout();
                      navigate("/masuk");
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Keluar
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Sangat ramah pengguna HP) */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            if (item.highlight) {
              return (
                <button
                  key={item.label}
                  onClick={() => go(item.to)}
                  className="flex flex-col items-center justify-center -mt-4 group focus:outline-hidden"
                  aria-label={item.label}
                >
                  <span className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center transition-transform active:scale-95 group-hover:scale-105">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-[10px] font-semibold text-foreground mt-0.5">
                    {item.label}
                  </span>
                </button>
              );
            }
            return (
              <button
                key={item.label}
                onClick={() => go(item.to)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[56px] ${
                  active
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 mb-0.5 ${active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                <span className="text-[10px] leading-tight truncate">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

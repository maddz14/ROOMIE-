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
} from "lucide-react";

const MENU: Record<string, { label: string; to: string; icon: any }[]> = {
  peminjam: [
    { label: "Beranda", to: "/beranda", icon: Home },
    { label: "Ruang", to: "/ruang", icon: Building2 },
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
    { label: "Hari Ini", to: "/satpam", icon: ShieldCheck },
    { label: "Kalender", to: "/kalender", icon: CalendarDays },
  ],
  admin: [
    { label: "Beranda", to: "/beranda", icon: Home },
    { label: "Kalender", to: "/kalender", icon: CalendarDays },
    { label: "Laporan", to: "/laporan", icon: BarChart3 },
    { label: "Admin", to: "/admin", icon: Settings2 },
  ],
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

  const isActive = (to: string) => {
    if (to === "/beranda") return route.path === "/beranda" || route.path === "/";
    return route.path === to || route.path.startsWith(to + "/");
  };

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 h-14 flex items-center gap-2">
        {/* Logo */}
        <button
          onClick={() => navigate("/beranda")}
          className="flex items-center gap-2 shrink-0"
          aria-label="ROOMIE beranda"
        >
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            R
          </span>
          <span className="font-bold tracking-tight text-foreground hidden sm:block">
            ROOMIE
          </span>
        </button>

        {/* Menu desktop */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <button
                key={it.to}
                onClick={() => go(it.to)}
                className={`px-3 h-9 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors ${
                  isActive(it.to)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {/* Lonceng notifikasi */}
          <button
            onClick={() => navigate("/notifikasi")}
            className="relative h-9 w-9 grid place-items-center rounded-lg hover:bg-accent text-foreground/80"
            aria-label="Notifikasi"
          >
            <Bell className="h-5 w-5" />
            {user.unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                {user.unread > 99 ? "99+" : user.unread}
              </span>
            )}
          </button>

          {/* Menu pengguna */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 px-2 rounded-lg hover:bg-accent inline-flex items-center gap-2 text-sm">
                <span className="grid place-items-center h-7 w-7 rounded-full bg-accent text-accent-foreground font-semibold text-xs">
                  {user.nama.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:block max-w-[120px] truncate font-medium">
                  {user.nama}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold truncate">{user.nama}</span>
                  <span className="text-xs text-muted-foreground font-normal truncate">
                    {user.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profil")}>
                <UserIcon className="h-4 w-4 mr-2" /> Profil
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await logout();
                  toast.success("Anda telah keluar.");
                  navigate("/masuk");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu mobile */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden h-9 w-9 grid place-items-center rounded-lg hover:bg-accent"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigasi</SheetTitle>
              <div className="h-14 px-4 flex items-center gap-2 border-b">
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  R
                </span>
                <span className="font-bold tracking-tight">ROOMIE</span>
              </div>
              <nav className="p-3 flex flex-col gap-1">
                {items.map((it) => {
                  const Icon = it.icon;
                  return (
                    <button
                      key={it.to}
                      onClick={() => go(it.to)}
                      className={`px-3 h-11 rounded-lg text-sm font-medium inline-flex items-center gap-3 transition-colors ${
                        isActive(it.to)
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/80 hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {it.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => go("/notifikasi")}
                  className="px-3 h-11 rounded-lg text-sm font-medium inline-flex items-center gap-3 text-foreground/80 hover:bg-accent"
                >
                  <Bell className="h-4 w-4" /> Notifikasi
                  {user.unread > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 px-1 grid place-items-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {user.unread}
                    </span>
                  )}
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

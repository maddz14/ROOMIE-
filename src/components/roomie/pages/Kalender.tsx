"use client";

import { useEffect, useMemo, useState } from "react";
import { navigate } from "../router";
import { useRoute } from "../router";
import { api } from "../api";
import { useAuth } from "../auth";
import { useMeta } from "../meta";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader, StatusBadge, EmptyState } from "../ui-bits";
import { ChevronLeft, ChevronRight, CalendarDays, Info } from "lucide-react";

type CalBooking = {
  id: number;
  kodeBooking: string | null;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  status: string;
  diLuarJamKerja: boolean;
  judul: string;
  judulAsli: string | null;
  pemohon: { nama: string; unit: string | null } | null;
};
type Holiday = { tanggal: string; keterangan: string };

const JAM_MULAI = 7;
const JAM_AKHIR = 22;
const PX_PER_MIN = 1.6; // 30 menit = 48px

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Senin dari minggu yang memuat tanggal YYYY-MM-DD. */
function mondayOf(tanggal: string): string {
  const d = new Date(tanggal + "T12:00:00+07:00");
  const js = d.getUTCDay(); // 0=Min..6=Sab
  const dow = js === 0 ? 7 : js;
  d.setUTCDate(d.getUTCDate() - (dow - 1));
  return d.toISOString().slice(0, 10);
}
function addDays(tanggal: string, n: number): string {
  const d = new Date(tanggal + "T12:00:00+07:00");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function Kalender() {
  const route = useRoute();
  const { user } = useAuth();
  const { meta } = useMeta();

  const [ruangList, setRuangList] = useState<{ id: number; nama: string; kode: string }[]>([]);
  const [ruangId, setRuangId] = useState<string>(
    route.query.get("ruang") || "",
  );
  const [focus, setFocus] = useState<string>(
    route.query.get("tanggal") || new Date().toISOString().slice(0, 10),
  );
  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState<{
    bookings: CalBooking[];
    holidays: Holiday[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CalBooking | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    (async () => {
      const d = await api<{ ruang: any[] }>("/api/ruang");
      const list = d.ruang.map((r) => ({ id: r.id, nama: r.nama, kode: r.kode }));
      setRuangList(list);
      if (!ruangId && list.length > 0) setRuangId(String(list[0].id));
    })();
  }, []);

  const monday = mondayOf(focus);
  const sunday = addDays(monday, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  useEffect(() => {
    if (!ruangId) return;
    (async () => {
      setLoading(true);
      try {
        const d = await api<{ bookings: CalBooking[]; holidays: Holiday[] }>(
          `/api/kalender?ruang=${ruangId}&dari=${monday}&sampai=${sunday}`,
        );
        setData(d);
      } finally {
        setLoading(false);
      }
    })();
  }, [ruangId, monday, sunday]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, CalBooking[]>();
    (data?.bookings || []).forEach((b) => {
      const arr = map.get(b.tanggal) || [];
      arr.push(b);
      map.set(b.tanggal, arr);
    });
    return map;
  }, [data]);

  const holidaySet = new Set((data?.holidays || []).map((h) => h.tanggal));

  function slotClick(tanggal: string, jamMulai: string) {
    if (user?.roleNama !== "peminjam") return;
    if (tanggal < todayStr) return;
    navigate(`/ajukan?ruang=${ruangId}&tanggal=${tanggal}&mulai=${jamMulai}`);
  }

  function DayColumn({ day }: { day: string }) {
    const list = bookingsByDay.get(day) || [];
    const dow = new Date(day + "T12:00:00+07:00").getUTCDay();
    const isWeekend = dow === 0 || dow === 6;
    const isHoliday = holidaySet.has(day);
    const isToday = day === todayStr;
    const isPast = day < todayStr;
    const dayName = NAMA_HARI[(dow === 0 ? 6 : dow - 1)];
    const dayNum = parseInt(day.slice(8), 10);

    return (
      <div className="relative">
        <div
          className={`text-center py-2 border-b border-border ${
            isToday ? "bg-accent text-accent-foreground" : ""
          }`}
        >
          <p className="text-xs font-medium text-muted-foreground">{dayName}</p>
          <p
            className={`text-lg font-bold ${
              isToday ? "text-primary" : "text-foreground"
            }`}
          >
            {dayNum}
          </p>
          {isHoliday && (
            <p className="text-[10px] text-amber-700 truncate px-1">
              {(data?.holidays || []).find((h) => h.tanggal === day)?.keterangan}
            </p>
          )}
        </div>
        <div className="relative" style={{ height: (JAM_AKHIR - JAM_MULAI) * 60 * PX_PER_MIN }}>
          {/* gridlines tiap 30 menit */}
          {Array.from({ length: (JAM_AKHIR - JAM_MULAI) * 2 }, (_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-border/60"
              style={{ top: i * 30 * PX_PER_MIN }}
            />
          ))}
          {isWeekend || isHoliday ? (
            <div className="absolute inset-0 bg-muted/40 pointer-events-none" />
          ) : null}
          {/* booking blocks */}
          {list.map((b) => {
            const top = (toMin(b.jamMulai) - JAM_MULAI * 60) * PX_PER_MIN;
            const height = (toMin(b.jamSelesai) - toMin(b.jamMulai)) * PX_PER_MIN;
            const isMine = b.pemohon && user && b.judulAsli !== null;
            return (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className={`absolute left-1 right-1 rounded-md p-1.5 text-left text-[11px] leading-tight overflow-hidden border st-status-${b.status} ${b.status === "berlangsung" ? "ring-2 ring-primary/40" : ""}`}
                style={{ top: Math.max(top, 0), height: Math.max(height - 2, 18) }}
              >
                <p className="font-semibold truncate">{b.judul}</p>
                <p className="opacity-80 truncate">
                  {b.jamMulai}–{b.jamSelesai}
                </p>
              </button>
            );
          })}
          {/* slot kosong yang bisa diklik (peminjam) */}
          {user?.roleNama === "peminjam" && !isPast && !isWeekend && !isHoliday && (
            <>
              {Array.from({ length: (JAM_AKHIR - JAM_MULAI) * 2 }, (_, i) => {
                const min = (JAM_MULAI * 60) + i * 30;
                const hh = String(Math.floor(min / 60)).padStart(2, "0");
                const mm = String(min % 60).padStart(2, "0");
                const occupied = list.some(
                  (b) => toMin(b.jamMulai) <= min && min < toMin(b.jamSelesai),
                );
                if (occupied) return null;
                return (
                  <div
                    key={i}
                    onClick={() => slotClick(day, `${hh}:${mm}`)}
                    className="absolute left-1 right-1 rounded-md hover:bg-accent/70 cursor-pointer group"
                    style={{ top: i * 30 * PX_PER_MIN, height: 30 * PX_PER_MIN - 2 }}
                    title={`Ajukan pukul ${hh}:${mm}`}
                  />
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  }

  const visibleDays = isMobile ? [focus] : days;

  return (
    <div>
      <PageHeader title="Kalender" description="Lihat ketersediaan ruang per minggu." />

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <Select value={ruangId} onValueChange={setRuangId}>
          <SelectTrigger className="w-full sm:w-64">
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

        <div className="flex items-center gap-1 sm:ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setFocus(isMobile ? addDays(focus, -1) : addDays(monday, -7))
            }
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setFocus(todayStr)}>
            Hari ini
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setFocus(isMobile ? addDays(focus, 1) : addDays(monday, 7))
            }
            aria-label="Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <input
            type="date"
            value={focus}
            onChange={(e) => setFocus(e.target.value || todayStr)}
            className="ml-1 h-9 rounded-lg border border-border bg-card px-2 text-sm"
            aria-label="Pilih tanggal"
          />
        </div>
      </div>

      {!ruangId ? (
        <Loading />
      ) : loading ? (
        <Loading />
      ) : (
        <>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div
              className={`roomie-cal-grid ${isMobile ? "" : ""}`}
            >
              {/* kolom jam */}
              <div>
                <div className="h-[52px] border-b border-border bg-muted/40" />
                {Array.from({ length: (JAM_AKHIR - JAM_MULAI) * 2 }, (_, i) => {
                  const min = JAM_MULAI * 60 + i * 30;
                  const hh = String(Math.floor(min / 60)).padStart(2, "0");
                  const mm = String(min % 60).padStart(2, "0");
                  return (
                    <div
                      key={i}
                      className="text-[10px] text-muted-foreground pr-1 text-right tabular-nums"
                      style={{ height: 30 * PX_PER_MIN, lineHeight: `${30 * PX_PER_MIN}px` }}
                    >
                      {i % 2 === 0 ? `${hh}:${mm}` : ""}
                    </div>
                  );
                })}
              </div>
              {visibleDays.map((day) => (
                <div key={day}>
                  <DayColumn day={day} />
                </div>
              ))}
            </div>
          </div>

          {/* Legenda */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-muted-foreground font-medium">Legenda:</span>
            {["menunggu_kemahasiswaan", "disetujui", "berlangsung", "selesai", "ditolak", "dibatalkan"].map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <StatusBadge status={s} />
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Info className="h-3 w-3" /> Klik slot kosong untuk mengajukan
            </span>
          </div>
        </>
      )}

      {/* Modal ringkasan booking */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card border border-border rounded-xl p-5 max-w-sm w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{selected.judul}</h3>
              <StatusBadge status={selected.status} />
            </div>
            <dl className="mt-3 text-sm space-y-1.5">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tanggal</dt>
                <dd>{selected.tanggal}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Jam</dt>
                <dd>
                  {selected.jamMulai}–{selected.jamSelesai}
                </dd>
              </div>
              {selected.pemohon && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Pemohon</dt>
                  <dd>{selected.pemohon.nama}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Kode</dt>
                <dd className="font-mono text-xs">{selected.kodeBooking}</dd>
              </div>
              {selected.diLuarJamKerja && (
                <p className="text-amber-700 text-xs pt-1">
                  Pengajuan di luar jam kerja.
                </p>
              )}
            </dl>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Tutup
              </Button>
              {(user?.roleNama !== "peminjam" || selected.judulAsli !== null) && (
                <Button
                  onClick={() => {
                    navigate(`/pengajuan/${selected.id}`);
                    setSelected(null);
                  }}
                >
                  Lihat detail
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

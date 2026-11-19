"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/rules";

export type Meta = {
  units: { id: number; nama: string; tipe: string }[];
  facilities: { id: number; nama: string; satuan: string }[];
  holidays: { tanggal: string; keterangan: string }[];
  jenisKegiatan: { value: string; label: string }[];
  tipeRuang: { value: string; label: string }[];
  ketentuan: string[];
  settings: Settings;
  demoMode: boolean;
};

const EMPTY: Meta = {
  units: [],
  facilities: [],
  holidays: [],
  jenisKegiatan: [],
  tipeRuang: [],
  ketentuan: [],
  settings: DEFAULT_SETTINGS,
  demoMode: false,
};

const MetaCtx = createContext<{ meta: Meta; loading: boolean }>({
  meta: EMPTY,
  loading: true,
});

export function MetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<Meta>(EMPTY);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api<Meta>("/api/meta")
      .then((m) => {
        if (active) {
          setMeta(m);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <MetaCtx.Provider value={{ meta, loading }}>{children}</MetaCtx.Provider>
  );
}

export function useMeta() {
  return useContext(MetaCtx);
}

"use client";

import { useEffect, useState, useCallback } from "react";

export type Route = {
  path: string; // mis. "/pengajuan/12"
  segments: string[]; // ["pengajuan", "12"]
  query: URLSearchParams;
  hash: string;
};

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, qs] = raw.split("?");
  const norm = path.startsWith("/") ? path : "/" + path;
  const segments = norm.split("/").filter(Boolean);
  return {
    path: norm,
    segments,
    query: new URLSearchParams(qs || ""),
    hash: window.location.hash,
  };
}

export function useRoute(): Route {
  // Selalu mulai dari nilai default agar server & client identik (anti
  // hydration mismatch). Rute asli dibaca di useEffect setelah hydrasi.
  const [route, setRoute] = useState<Route>({
    path: "/",
    segments: [],
    query: new URLSearchParams(),
    hash: "",
  });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoute(parse());
    const on = () => setRoute(parse());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function navigate(to: string) {
  const target = to.startsWith("#") ? to : "#" + (to.startsWith("/") ? to : "/" + to);
  if (window.location.hash === target) {
    // paksa re-render walau hash sama
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target;
  }
  window.scrollTo({ top: 0 });
}

export function useNavigate() {
  return useCallback((to: string) => navigate(to), []);
}

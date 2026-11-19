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
  const [route, setRoute] = useState<Route>(() =>
    typeof window === "undefined"
      ? { path: "/", segments: [], query: new URLSearchParams(), hash: "" }
      : parse(),
  );
  useEffect(() => {
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

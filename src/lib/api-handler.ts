// Pembungkus route handler: otentikasi, otorisasi peran, CSRF sederhana,
// normalisasi params, penanganan galat standar, dan penggabungan Set-Cookie.

import { getUserFromRequest, type SessionUser } from "./auth";
import { AppError, ERR } from "./errors";

export type ApiCtx = {
  req: Request;
  params: Record<string, string>;
  user: SessionUser | null;
  sid: string | null;
  setCookie: (cookie: string) => void;
  json: (data: unknown, status?: number) => Response;
};

type Handler = (ctx: ApiCtx) => Promise<Response> | Response;

type Opts = {
  roles?: string[]; // bila diisi, hanya peran ini yang boleh
  public?: boolean; // endpoint publik (tanpa perlu sesi), mis. healthz
  skipCsrf?: boolean;
};

function errorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    const body: {
      error: { code: string; message: string; fields?: Record<string, string> };
    } = { error: { code: err.code, message: err.message } };
    if (err.fields) body.error.fields = err.fields;
    return Response.json(body, { status: err.status });
  }
  console.error("[api] kesalahan tak tertangani:", err);
  return Response.json(
    {
      error: {
        code: "KESALAHAN_SERVER",
        message: "Terjadi kesalahan. Coba beberapa saat lagi.",
      },
    },
    { status: 500 },
  );
}

function attachCookies(res: Response, cookies: string[]): Response {
  if (cookies.length === 0) return res;
  const headers = new Headers(res.headers);
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function checkCsrf(req: Request): void {
  const m = req.method.toUpperCase();
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return;
  const origin = hostOf(req.headers.get("origin") || req.headers.get("referer"));
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (origin && host && origin !== host) {
    throw ERR.TIDAK_BERWENANG("Permintaan ditolak oleh perlindungan CSRF.");
  }
}

export function withApi(handler: Handler, opts: Opts = {}) {
  return async (
    req: Request,
    segment?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ): Promise<Response> => {
    let params: Record<string, string> = {};
    if (segment?.params) {
      const p = segment.params as
        | Promise<Record<string, string>>
        | Record<string, string>;
      params = typeof (p as Promise<unknown>).then === "function" ? await p : p;
    }
    try {
      checkCsrf(req);
    } catch (err) {
      return errorResponse(err);
    }
    const cookies: string[] = [];
    let user: SessionUser | null = null;
    let sid: string | null = null;
    if (!opts.public) {
      const r = await getUserFromRequest(req);
      user = r.user;
      sid = r.sid;
      if (r.cookie) cookies.push(r.cookie);
      if (opts.roles && opts.roles.length > 0) {
        if (!user) return attachCookies(errorResponse(ERR.BELUM_MASUK()), cookies);
        if (!opts.roles.includes(user.roleNama))
          return attachCookies(errorResponse(ERR.TIDAK_BERWENANG()), cookies);
      } else if (!user) {
        return attachCookies(errorResponse(ERR.BELUM_MASUK()), cookies);
      }
    } else {
      const r = await getUserFromRequest(req);
      user = r.user;
      sid = r.sid;
      if (r.cookie) cookies.push(r.cookie);
    }
    const ctx: ApiCtx = {
      req,
      params,
      user,
      sid,
      setCookie: (c) => cookies.push(c),
      json: (data, status = 200) =>
        Response.json(data, {
          status,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }),
    };
    try {
      const res = await handler(ctx);
      return attachCookies(res, cookies);
    } catch (err) {
      return attachCookies(errorResponse(err), cookies);
    }
  };
}

/** Membaca body JSON secara aman. */
export async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw ERR.INPUT_TIDAK_VALID({ body: "Body bukan JSON valid." });
  }
}

export function asString(v: unknown, key: string): string {
  if (typeof v !== "string" || v.length === 0)
    throw ERR.INPUT_TIDAK_VALID({ [key]: `${key} wajib diisi.` });
  return v;
}

export function asInt(v: unknown, key: string): number {
  const n = typeof v === "string" ? parseInt(v, 10) : v;
  if (typeof n !== "number" || Number.isNaN(n))
    throw ERR.INPUT_TIDAK_VALID({ [key]: `${key} harus berupa angka.` });
  return n;
}

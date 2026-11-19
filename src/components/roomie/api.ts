// Klien API sederhana: bungkus fetch, tangani format galat standar ROOMIE.

export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export class ApiException extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;
  constructor(err: ApiError, status: number) {
    super(err.message);
    this.code = err.code;
    this.status = status;
    this.fields = err.fields;
  }
}

type Options = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  formData?: FormData;
};

export async function api<T = any>(
  path: string,
  opts: Options = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(path, {
    method: opts.method || "GET",
    headers,
    body,
    credentials: "same-origin",
    signal: opts.signal,
  });
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // bukan JSON (mis. CSV / SVG) -> kembalikan response asli
      return { _raw: text, status: res.status } as any;
    }
  }
  if (!res.ok) {
    const err = (data?.error ?? { code: "KESALAHAN_SERVER", message: "Terjadi kesalahan." }) as ApiError;
    throw new ApiException(err, res.status);
  }
  return data as T;
}

/** Unduh blob (CSV / file) sebagai respons. */
export async function apiBlob(path: string): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(path, { credentials: "same-origin" });
  if (!res.ok) {
    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    const err = (data?.error ?? { code: "KESALAHAN_SERVER", message: "Gagal mengunduh." }) as ApiError;
    throw new ApiException(err, res.status);
  }
  const blob = await res.blob();
  const cd = res.headers.get("content-disposition") || "";
  const m = cd.match(/filename="?([^"]+)"?/);
  const filename = m ? m[1] : "unduhan";
  return { blob, filename };
}

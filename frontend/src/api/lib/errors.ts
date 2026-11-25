import axios from "axios";
import { toast } from "sonner";

type ApiErrorBody = {
  detail?: string | { msg?: string; loc?: (string | number)[] }[];
  message?: string;
  error?: string;
  [key: string]: unknown;
};

export function getErrorMessage(
  err: unknown,
  fallback = "Erro desconhecido"
): string {
  if (typeof err === "string") return err;

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data.length > 200 ? data.slice(0, 200) + "…" : data;
    }

    if (data && typeof data === "object") {
      const body = data as ApiErrorBody;

      if (typeof body.detail === "string" && body.detail.trim()) {
        return body.detail;
      }

      if (Array.isArray(body.detail) && body.detail.length > 0) {
        const msgs = body.detail
          .map((d) => (typeof d === "object" && d && "msg" in d ? d.msg : null))
          .filter((m): m is string => typeof m === "string" && m.length > 0);
        if (msgs.length > 0) return msgs.join(", ");
      }

      if (typeof body.message === "string" && body.message.trim()) {
        return body.message;
      }
      if (typeof body.error === "string" && body.error.trim()) {
        return body.error;
      }
    }

    if (status) {
      return err.message ? `${err.message} (${status})` : `Erro ${status}`;
    }
    return err.message || fallback;
  }

  if (err instanceof Error) {
    return err.message || fallback;
  }

  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }

  return fallback;
}

export function toastError(err: unknown, fallback?: string) {
  const message = getErrorMessage(err, fallback);
  console.error(err);
  toast.error(message);
  return message;
}
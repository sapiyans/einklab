import axios from 'axios';
const apiHost = import.meta.env.VITE_HOST_API;
import { toast } from "sonner";


const getCsrfToken = (): string | undefined => {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrftoken=`);
  return parts.length === 2 ? parts.pop()?.split(';').shift() : undefined;
};

const api = axios.create({
  baseURL: `${apiHost.replace(/\/+$/, "")}/api/`,
  headers: { "Content-Type": "application/json" },
});

// Request: CSRF
api.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();
  if (csrfToken) config.headers["X-CSRFToken"] = csrfToken;
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.showToast && response.data?.message) {
      toast.success(response.data.message);
    }
    return response;
  },
  (error) => {
    if (error.config?.showToast) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Erro ao processar requisição";
      toast.error(msg);
    }
    return Promise.reject(error);
  }
);

export default api;
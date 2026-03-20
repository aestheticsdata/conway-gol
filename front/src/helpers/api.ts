import { API_BASE_PATH } from "./constants";

export function getRequestURL(url: string): string {
  const normalizedUrl = url.replace(/^\/+/, "");
  return `${window.location.origin}${API_BASE_PATH}/${normalizedUrl}`;
}
